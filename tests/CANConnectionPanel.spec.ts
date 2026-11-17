import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { CANNetworksModel, SystemStateModel } from '@/client'

const getSystemState = vi.fn()
const getCANNetworks = vi.fn()
const getCANNetworksQuiet = vi.fn()
const connectCAN = vi.fn()
const disconnectCAN = vi.fn()
const resetCAN = vi.fn()
vi.mock('@/api/icoapi.ts', () => ({
  getSystemState: () => getSystemState(),
  getWSLink: () => 'ws://test/api/v1',
  getCANNetworks: () => getCANNetworks(),
  getCANNetworksQuiet: () => getCANNetworksQuiet(),
  connectCAN: (network: any) => connectCAN(network),
  disconnectCAN: (unit?: string) => disconnectCAN(unit),
  resetCAN: () => resetCAN()
}))

import CANConnectionPanel from '@/components/misc/CANConnectionPanel.vue'
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts'

class FakeWebSocket {
  close() {}
}

const NETWORK = { interface: 'pcan', channel: 'PCAN_USBBUS1', bitrate: 1000000 }

function state(overrides: Partial<SystemStateModel> = {}): SystemStateModel {
  return {
    can_network_found: true,
    stu_connected: false,
    can_status: 'NETWORK_FOUND',
    can_networks: [NETWORK],
    can_selected: null,
    can_error: null,
    disk_capacity: { total: 1, available: 1 } as any,
    measurement_status: { running: false } as any,
    cloud: { enabled: false, healthy: false },
    ...overrides
  }
}

async function mountPanel(initial: SystemStateModel) {
  getSystemState.mockResolvedValue(initial)
  const store = useGeneralStore()
  await store.systemState.checkState()
  const wrapper = mount(CANConnectionPanel)
  await flushPromises()
  return { wrapper, store }
}

function button(wrapper: any, label: string) {
  return wrapper.findAll('button').find((b: any) => b.text().includes(label))
}

describe('CANConnectionPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    vi.stubGlobal('WebSocket', FakeWebSocket)
    for (const mock of [getSystemState, getCANNetworks, getCANNetworksQuiet, connectCAN, disconnectCAN, resetCAN]) {
      mock.mockReset()
    }
    getCANNetworksQuiet.mockResolvedValue({} as CANNetworksModel)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('lists the networks and the status', async () => {
    const { wrapper } = await mountPanel(state())
    expect(wrapper.text()).toContain('PCAN_USBBUS1')
    expect(wrapper.text()).toContain('Network found, not connected')
  })

  it('connects to the chosen network', async () => {
    connectCAN.mockResolvedValue({})
    const { wrapper } = await mountPanel(state())
    await button(wrapper, 'Connect')!.trigger('click')
    expect(connectCAN).toHaveBeenCalledWith({ interface: 'pcan', channel: 'PCAN_USBBUS1' })
  })

  it('offers to disconnect the connected network', async () => {
    disconnectCAN.mockResolvedValue({})
    const { wrapper } = await mountPanel(state({
      can_status: 'CONNECTED', can_selected: NETWORK, stu_connected: true
    }))
    expect(wrapper.text()).toContain('Connected')
    await button(wrapper, 'Disconnect')!.trigger('click')
    expect(disconnectCAN).toHaveBeenCalled()
  })

  it('offers to reset the connected network', async () => {
    resetCAN.mockResolvedValue(undefined)
    const { wrapper } = await mountPanel(state())
    expect(button(wrapper, 'Reset')).toBeUndefined()

    const connected = await mountPanel(state({
      can_status: 'CONNECTED', can_selected: NETWORK, stu_connected: true
    }))
    await button(connected.wrapper, 'Reset')!.trigger('click')
    expect(resetCAN).toHaveBeenCalled()
  })

  it('disables the buttons while connecting and during a measurement', async () => {
    const { wrapper } = await mountPanel(state({ can_status: 'CONNECTING', can_selected: NETWORK }))
    expect(button(wrapper, 'Connect')!.attributes('disabled')).toBeDefined()

    const running = await mountPanel(state({ measurement_status: { running: true } as any }))
    expect(button(running.wrapper, 'Connect')!.attributes('disabled')).toBeDefined()
  })

  it('shows the connection error', async () => {
    const { wrapper } = await mountPanel(state({ can_status: 'ERROR', can_error: 'interface down' }))
    expect(wrapper.text()).toContain('interface down')
  })

  it('searches on an interval, if enabled', async () => {
    const { store } = await mountPanel(state())
    getCANNetworksQuiet.mockClear()
    await vi.advanceTimersByTimeAsync(store.canScanIntervalMs * 2)
    expect(getCANNetworksQuiet).toHaveBeenCalledTimes(2)
  })

  it('does not search if the toggle is off, connected or after an error', async () => {
    const off = await mountPanel(state())
    off.store.canAutoScan = false
    getCANNetworksQuiet.mockClear()
    await vi.advanceTimersByTimeAsync(off.store.canScanIntervalMs * 2)
    expect(getCANNetworksQuiet).not.toHaveBeenCalled()

    for (const status of ['CONNECTED', 'ERROR'] as const) {
      setActivePinia(createPinia())
      const { store } = await mountPanel(state({ can_status: status, can_selected: NETWORK }))
      getCANNetworksQuiet.mockClear()
      await vi.advanceTimersByTimeAsync(store.canScanIntervalMs * 2)
      expect(getCANNetworksQuiet).not.toHaveBeenCalled()
    }
  })
})

describe('CANConnectionPanel with several units', () => {
  const SECOND = { interface: 'pcan', channel: 'PCAN_USBBUS2', bitrate: 1000000 }
  const unit = (network: typeof NETWORK) => ({
    unit: `${network.interface}:${network.channel}`,
    network,
    stu_connected: true,
    sth_connected: null
  })

  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    vi.stubGlobal('WebSocket', FakeWebSocket)
    for (const mock of [getSystemState, getCANNetworks, getCANNetworksQuiet, connectCAN, disconnectCAN, resetCAN]) {
      mock.mockReset()
    }
    getCANNetworksQuiet.mockResolvedValue({} as CANNetworksModel)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('only offers networks that are not units yet', async () => {
    const { wrapper } = await mountPanel(state({
      can_status: 'CONNECTED',
      stu_connected: true,
      can_networks: [NETWORK, SECOND],
      can_selected: NETWORK,
      units: [unit(NETWORK)]
    }))

    expect(wrapper.text()).toContain('Add Unit')
    // A dropdown with the network that can be added, no table
    expect(wrapper.find('[data-test="add-unit"]').text()).toContain('PCAN_USBBUS2')
    expect(wrapper.text()).not.toContain('PCAN_USBBUS1')
    expect(wrapper.find('table').exists()).toBe(false)
    // Disconnecting is done in the card of the unit
    expect(button(wrapper, 'Disconnect')).toBeUndefined()
    expect(button(wrapper, 'Add')).toBeDefined()
  })

  it('only has the headline and the discover inputs without a network', async () => {
    const { wrapper } = await mountPanel(state({
      can_status: 'CONNECTED',
      stu_connected: true,
      can_networks: [NETWORK],
      can_selected: NETWORK,
      units: [unit(NETWORK)]
    }))

    expect(wrapper.text()).toContain('Add Unit')
    expect(button(wrapper, 'Discover')).toBeDefined()
    expect(wrapper.text()).toContain('Discover automatically')
    expect(wrapper.find('[data-test="add-unit"]').exists()).toBe(false)
    expect(button(wrapper, 'Add')).toBeUndefined()
  })

  it('adds a network without disconnecting the others', async () => {
    connectCAN.mockResolvedValue({})
    const { wrapper } = await mountPanel(state({
      can_status: 'CONNECTED',
      stu_connected: true,
      can_networks: [NETWORK, SECOND],
      can_selected: NETWORK,
      units: [unit(NETWORK)]
    }))

    await button(wrapper, 'Add').trigger('click')
    await flushPromises()

    expect(connectCAN).toHaveBeenCalledWith({
      interface: 'pcan', channel: 'PCAN_USBBUS2'
    })
    expect(disconnectCAN).not.toHaveBeenCalled()
  })

  it('keeps searching for networks while units are connected', async () => {
    await mountPanel(state({
      can_status: 'CONNECTED',
      stu_connected: true,
      can_networks: [NETWORK],
      can_selected: NETWORK,
      units: [unit(NETWORK)]
    }))
    getCANNetworksQuiet.mockClear()

    await vi.advanceTimersByTimeAsync(10_000)

    expect(getCANNetworksQuiet).toHaveBeenCalled()
  })

  it('disconnects without a unit if there is no multi STU support', async () => {
    disconnectCAN.mockResolvedValue({})
    const { wrapper } = await mountPanel(state({
      can_status: 'CONNECTED', stu_connected: true, can_selected: NETWORK
    }))

    await button(wrapper, 'Disconnect').trigger('click')
    await flushPromises()

    expect(disconnectCAN).toHaveBeenCalledWith(undefined)
  })
})
