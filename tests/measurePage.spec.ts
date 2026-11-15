import { useMeasurementStore } from '@/stores/measurementStore/measurementStore.ts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import type { Sensor, SystemStateModel } from '@/client'

/*
 * Several people can use the same device. Someone who opens the Measure page
 * while another person's measurement is running sees that measurement, taken
 * from the API, even without any local knowledge about the devices.
 */

const getSystemState = vi.fn()
const getPreflight = vi.fn()
const startMeasurement = vi.fn()
vi.mock('@/api/icoapi.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/icoapi.ts')>()),
  getSystemState: () => getSystemState(),
  getPreflight: () => getPreflight(),
  startMeasurement: (instructions: unknown) => startMeasurement(instructions),
  getWSLink: () => 'ws://test/api/v1',
  getSensorInformation: () => Promise.resolve({
    sensors: [SENSOR],
    configurations: [{
      configuration_id: 'default',
      configuration_name: 'Default',
      channels: { '1': SENSOR, '2': SENSOR }
    }],
    default_configuration_id: 'default'
  })
}))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))
vi.mock('@/utils/useYamlConfig.ts', () => ({
  useYamlConfig: () => ({
    isEnabled: () => Promise.resolve(false),
    reload: () => Promise.resolve(),
    config: ref(null)
  })
}))

import MeasurePage from '@/pages/measure.vue'
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts'
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts'

const SENSOR: Sensor = {
  name: 'Acceleration 100g',
  sensor_type: null,
  sensor_id: 'acc100g_01',
  unit: 'g',
  dimension: 'Acceleration',
  phys_min: -100,
  phys_max: 100,
  volt_min: 0,
  volt_max: 3.3
}

const sockets: string[] = []
const instances: FakeWebSocket[] = []
class FakeWebSocket {
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  onmessage: ((event: unknown) => void) | null = null
  constructor(url: string) {
    sockets.push(url)
    instances.push(this)
  }
  close() {}
  receive(frames: unknown[]) {
    this.onmessage?.({ data: JSON.stringify(frames) })
  }
  dispatchEvent() { return true }
}

function state(overrides: Partial<SystemStateModel> = {}): SystemStateModel {
  return {
    can_network_found: true,
    stu_connected: true,
    can_status: 'CONNECTED',
    can_networks: [],
    can_selected: null,
    can_error: null,
    sth_connected: null,
    disk_capacity: { total: 1, available: 1 } as any,
    measurement_status: { running: false },
    cloud: { enabled: false, healthy: false },
    ...overrides
  }
}

// The stores of the page (the tests use the same ones)
let pinia = createPinia()

async function mountPage(initial: SystemStateModel) {
  getSystemState.mockResolvedValue(initial)
  await useGeneralStore().systemState.checkState()
  setActivePinia(pinia)
  const wrapper = mount(MeasurePage, {
    global: {
      plugins: [pinia],
      stubs: {
        StreamingChart: true,
        ADCDrawer: true,
        PreMetaData: true,
        PostMetaModal: true,
        Toast: true,
        RouterLink: true
      }
    }
  })
  await flushPromises()
  return wrapper
}

describe('Measure page with several clients', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    sockets.length = 0
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows a measurement another client started', async () => {
    // A fresh browser: no sensor devices listed locally
    expect(useHardwareStore().STHDeviceList).toHaveLength(0)

    const wrapper = await mountPage(state({
      sth_connected: { name: 'Test-STH', mac_address: '14-2D-41-D7-77-7D' },
      measurement_status: {
        running: true,
        name: 'Remote__2026-11-12_10-00-00',
        start_time: new Date(Date.now() - 65_000).toISOString(),
        tool_name: 'Test-STH',
        start_supply_voltage: 3.91,
        instructions: {
          name: 'Remote',
          mac_address: '14-2D-41-D7-77-7D',
          time: null,
          first: { sensor_id: 'acc100g_01' },
          second: { sensor_id: null },
          third: { sensor_id: null },
          ift_requested: false,
          ift_channel: '',
          ift_window_width: 150
        }
      }
    }))

    const text = wrapper.text()
    expect(text).not.toContain('Nothing to Measure')
    expect(text).toContain('Running Measurement')
    expect(text).toContain('Remote__2026-11-12_10-00-00')
    expect(text).toContain('[1] Acceleration 100g')
    expect(text).toContain('Test-STH')
    expect(text).toContain('3.91V (at start)')
    expect(text).toContain('Until stopped')
    expect(text).toContain('01:05')
    // The settings of this browser are not shown for someone else's measurement
    expect(text).not.toContain('Start Recording')
    // The live data is shown right away
    expect(sockets.some(url => url.endsWith('/measurement/stream'))).toBe(true)
  })

  it('takes the sensor device from the API', async () => {
    const wrapper = await mountPage(state({
      sth_connected: { name: 'Test-STH', mac_address: '14-2D-41-D7-77-7D' }
    }))

    const text = wrapper.text()
    expect(text).not.toContain('Nothing to Measure')
    expect(text).toContain('Test-STH')
    expect(text).toContain('14-2D-41-D7-77-7D')
    expect(text).toContain('Start Recording')
    expect(sockets.some(url => url.endsWith('/measurement/stream'))).toBe(false)
  })

  it('asks to connect a device if the API has none', async () => {
    const wrapper = await mountPage(state())

    expect(wrapper.text()).toContain('Nothing to Measure')
  })
})

/*
 * With several STUs (multi STU support) every unit has its own sensor device
 * and its own data. A measurement uses all units.
 */
const NETWORK = { interface: 'pcan', channel: 'x', bitrate: 1000000 }
const UNIT_A = 'pcan:PCAN_USBBUS1'
const UNIT_B = 'pcan:PCAN_USBBUS2'

function unitState(overrides: Partial<SystemStateModel> = {}): SystemStateModel {
  return state({
    sth_connected: { name: 'STH-A', mac_address: '00-00-00-00-00-0A' },
    units: [
      { unit: UNIT_A, network: NETWORK, stu_connected: true,
        sth_connected: { name: 'STH-A', mac_address: '00-00-00-00-00-0A' } },
      { unit: UNIT_B, network: { ...NETWORK, channel: 'y' }, stu_connected: true,
        sth_connected: { name: 'STH-B', mac_address: '00-00-00-00-00-0B' } }
    ],
    ...overrides
  })
}

function check(unit: string, name: string, problems: string[] = []) {
  return {
    unit, ok: problems.length === 0, problems, tool_name: name,
    rssi: -50, supply_voltage: 3.9, sample_rate: 3175
  }
}

const READY = { ready: true, units: [check(UNIT_A, 'STH-A'), check(UNIT_B, 'STH-B')] }

function startButton(wrapper: any) {
  return wrapper.findAll('button').find((b: any) => b.text().includes('Start Recording'))
}

describe('Measure page with several units', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    sockets.length = 0
    instances.length = 0
    getPreflight.mockReset()
    startMeasurement.mockReset()
    getPreflight.mockResolvedValue(READY)
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows every unit with its sensor device', async () => {
    const wrapper = await mountPage(unitState())

    const text = wrapper.text()
    expect(wrapper.findAll('[data-test="unit-row"]')).toHaveLength(2)
    expect(text).toContain('STH-A')
    expect(text).toContain('STH-B')
    expect(text).toContain('00-00-00-00-00-0B')
    expect(text).toContain(UNIT_B)
  })

  it('checks all units before measuring', async () => {
    const wrapper = await mountPage(unitState())

    expect(getPreflight).toHaveBeenCalled()
    expect(wrapper.findAll('[data-test="preflight-unit"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('Ready')
    expect(startButton(wrapper)?.attributes('disabled')).toBeUndefined()
  })

  it('does not allow to measure if a unit is not ready', async () => {
    getPreflight.mockResolvedValue({
      ready: false,
      units: [check(UNIT_A, 'STH-A'), check(UNIT_B, 'STH-B', ['The connection to the sensor device is too weak'])]
    })
    const wrapper = await mountPage(unitState())

    expect(wrapper.text()).toContain('The connection to the sensor device is too weak')
    expect(startButton(wrapper)?.attributes('disabled')).toBeDefined()
  })

  it('does not allow to measure if the check failed', async () => {
    getPreflight.mockRejectedValue({ error: true, message: 'The API does not answer' })
    const wrapper = await mountPage(unitState())

    expect(wrapper.text()).toContain('The API does not answer')
  })

  it('starts all units with their own sensors', async () => {
    startMeasurement.mockResolvedValue({ data: { name: 'file' } })
    const wrapper = await mountPage(unitState())

    await startButton(wrapper).trigger('click')
    await flushPromises()

    expect(startMeasurement).toHaveBeenCalledTimes(1)
    const instructions = startMeasurement.mock.calls[0][0]
    expect(Object.keys(instructions.units)).toEqual([UNIT_A, UNIT_B])
    expect(instructions.units[UNIT_B].first).toEqual({ sensor_id: 'acc100g_01' })
    expect(instructions.units[UNIT_B].mac_address).toBe('00-00-00-00-00-0B')
    expect(instructions.mac_address).toBe('00-00-00-00-00-0A')
    expect(instructions.first).toEqual({ sensor_id: 'acc100g_01' })
    expect(instructions.ift_requested).toBe(false)
  })

  it('lets every unit measure its own number of channels', async () => {
    startMeasurement.mockResolvedValue({ data: { name: 'file' } })
    const wrapper = await mountPage(unitState())
    // The page sets up the units after loading the sensors: wait for it
    await vi.waitFor(() => expect(
      useHardwareStore(pinia).holderList.length).toBeGreaterThan(0))
    await flushPromises()
    const mStore = useMeasurementStore(pinia)
    mStore.unitActive[UNIT_B] = { first: true, second: true, third: false }
    mStore.unitChannels[UNIT_B] = {
      first: 'acc100g_01', second: 'acc100g_01', third: null
    }

    await startButton(wrapper).trigger('click')
    await flushPromises()

    const instructions = startMeasurement.mock.calls[0][0]
    expect(instructions.units[UNIT_A].second).toEqual({ sensor_id: null })
    expect(instructions.units[UNIT_B].second).toEqual({ sensor_id: 'acc100g_01' })
    expect(instructions.units[UNIT_B].third).toEqual({ sensor_id: null })
  })

  it('does not start if a unit is not ready', async () => {
    const wrapper = await mountPage(unitState())
    // The unit became unready after the page checked it
    getPreflight.mockResolvedValue({
      ready: false, units: [check(UNIT_A, 'STH-A', ['No sensor device (STH) is connected'])]
    })

    await startButton(wrapper).trigger('click')
    await flushPromises()

    expect(startMeasurement).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('No sensor device (STH) is connected')
  })

  it('checks the units again if the start failed', async () => {
    startMeasurement.mockRejectedValue({ error: true, message: '' })
    const wrapper = await mountPage(unitState())
    getPreflight.mockClear()

    await startButton(wrapper).trigger('click')
    await flushPromises()

    // Once before the start and once after the failure
    expect(getPreflight).toHaveBeenCalledTimes(2)
  })

  it('shows the measurement of all units', async () => {
    const wrapper = await mountPage(unitState({
      measurement_status: {
        running: true,
        name: 'Group__1',
        start_time: new Date(Date.now() - 5_000).toISOString(),
        tool_name: 'STH-A, STH-B',
        start_supply_voltage: 3.8,
        units: [
          { unit: UNIT_A, source: 'STH-A', tool_name: 'STH-A', stu_mac_address: 'a', sth_mac_address: '00-00-00-00-00-0A' },
          { unit: UNIT_B, source: 'STH-B', tool_name: 'STH-B', stu_mac_address: 'b', sth_mac_address: '00-00-00-00-00-0B' }
        ],
        instructions: {
          name: 'Group', mac_address: 'x', time: null,
          first: { sensor_id: 'acc100g_01' }, second: { sensor_id: null }, third: { sensor_id: null },
          ift_requested: false, ift_channel: '', ift_window_width: 150
        }
      }
    }))

    expect(wrapper.text()).toContain('Running Measurement')
    // One chart for every unit
    expect(wrapper.findAll('[data-test="live-chart"]')).toHaveLength(2)
    expect(wrapper.text()).toContain(`STH-B (${UNIT_B})`)
    // The units do not need to be checked while they measure
    expect(wrapper.find('[data-test="preflight-unit"]').exists()).toBe(false)
    // Several units: the page says how much of the live data it wants
    expect(sockets).toContain('ws://test/api/v1/measurement/stream?rate=200&updates=30')
  })

  it('shows the packet loss of every source', async () => {
    const wrapper = await mountPage(unitState({
      measurement_status: {
        running: true, name: 'Group__1', start_time: new Date().toISOString(),
        units: [
          { unit: UNIT_A, source: 'STH-A' }, { unit: UNIT_B, source: 'STH-B' }
        ],
        instructions: {
          name: 'Group', mac_address: 'x', time: null,
          first: { sensor_id: 'acc100g_01' }, second: { sensor_id: null }, third: { sensor_id: null },
          ift_requested: false, ift_channel: '', ift_window_width: 150
        }
      }
    }))
    const socket = instances[instances.length - 1]
    socket.onopen?.()

    socket.receive([
      { first: null, second: null, third: null, ift: null, counter: null, timestamp: null, dataloss: 0, source: 'STH-A' },
      { first: null, second: null, third: null, ift: null, counter: null, timestamp: null, dataloss: 0.25, source: 'STH-B' }
    ])
    await flushPromises()

    // The worst source decides the tag, every source has its value
    expect(wrapper.text()).toContain('25.00 % lost')
    expect(wrapper.text()).toContain('0.00 %')
  })
})
