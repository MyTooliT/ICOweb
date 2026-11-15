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
vi.mock('@/api/icoapi.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/icoapi.ts')>()),
  getSystemState: () => getSystemState(),
  getWSLink: () => 'ws://test/api/v1',
  getSensorInformation: () => Promise.resolve({
    sensors: [SENSOR],
    configurations: [{
      configuration_id: 'default',
      configuration_name: 'Default',
      channels: { '1': SENSOR }
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
class FakeWebSocket {
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  onmessage: ((event: unknown) => void) | null = null
  constructor(url: string) {
    sockets.push(url)
  }
  close() {}
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

async function mountPage(initial: SystemStateModel) {
  getSystemState.mockResolvedValue(initial)
  await useGeneralStore().systemState.checkState()
  const wrapper = mount(MeasurePage, {
    global: {
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
    setActivePinia(createPinia())
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
