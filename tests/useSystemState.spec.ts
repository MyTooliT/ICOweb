import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SystemStateModel } from '@/client'

const getSystemState = vi.fn()
vi.mock('@/api/icoapi.ts', () => ({
  getSystemState: () => getSystemState(),
  getWSLink: () => 'ws://test/api/v1'
}))

import { useSystemState } from '@/utils/useSystemState.ts'

class FakeWebSocket {
  onopen: any
  onmessage: any
  onerror: any
  onclose: any
  close() {}
}

function state(overrides: Partial<SystemStateModel> = {}): SystemStateModel {
  return {
    can_network_found: true,
    stu_connected: true,
    can_status: 'CONNECTED',
    can_networks: [{ interface: 'pcan', channel: 'PCAN_USBBUS1', bitrate: 1000000 }],
    can_selected: { interface: 'pcan', channel: 'PCAN_USBBUS1', bitrate: 1000000 },
    can_error: null,
    disk_capacity: { total: 1, available: 1 } as any,
    measurement_status: { running: false } as any,
    cloud: { enabled: false, healthy: false },
    ...overrides
  }
}

describe('useSystemState CAN state', () => {
  beforeEach(() => {
    getSystemState.mockReset()
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })

  it('maps the CAN fields of the state', async () => {
    getSystemState.mockResolvedValue(state())
    const system = useSystemState()
    await system.checkState()

    expect(system.canStatus.value).toBe('CONNECTED')
    expect(system.canNetworkFound.value).toBe(true)
    expect(system.stuConnected.value).toBe(true)
    expect(system.canSelected.value?.channel).toBe('PCAN_USBBUS1')
    expect(system.canNetworks.value).toHaveLength(1)
    expect(system.canConnected.value).toBe(true)
  })

  it('is not connected while the STU does not respond', async () => {
    getSystemState.mockResolvedValue(state({ stu_connected: false }))
    const system = useSystemState()
    await system.checkState()

    expect(system.canStatus.value).toBe('CONNECTED')
    expect(system.canConnected.value).toBe(false)
  })

  it('shows the error of a failed connection', async () => {
    getSystemState.mockResolvedValue(state({
      can_status: 'ERROR',
      can_selected: null,
      stu_connected: false,
      can_error: 'interface down'
    }))
    const system = useSystemState()
    await system.checkState()

    expect(system.canStatus.value).toBe('ERROR')
    expect(system.canError.value).toBe('interface down')
    expect(system.canNetworkFound.value).toBe(true)
  })

  it('resets the CAN state if the API is not reachable', async () => {
    getSystemState.mockResolvedValueOnce(state())
    const system = useSystemState()
    await system.checkState()
    getSystemState.mockRejectedValueOnce(new Error('offline'))
    await system.checkState()

    expect(system.reachable.value).toBe(false)
    expect(system.canStatus.value).toBe('NO_NETWORK')
    expect(system.canNetworks.value).toEqual([])
    expect(system.canSelected.value).toBeNull()
    expect(system.stuConnected.value).toBe(false)
  })
})

describe('useSystemState units', () => {
  beforeEach(() => {
    getSystemState.mockReset()
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })

  const NETWORK = { interface: 'pcan', channel: 'PCAN_USBBUS1', bitrate: 1000000 }

  it('has no units without multi STU support', async () => {
    getSystemState.mockResolvedValue(state())
    const system = useSystemState()
    await system.checkState()

    expect(system.units.value).toBeNull()
    expect(system.multiUnit.value).toBe(false)
  })

  it('maps the units of the state', async () => {
    getSystemState.mockResolvedValue(state({
      units: [
        { unit: 'pcan:PCAN_USBBUS1', network: NETWORK, stu_connected: true,
          sth_connected: { name: 'STH-A', mac_address: '00-00-00-00-00-01' } },
        { unit: 'pcan:PCAN_USBBUS2', network: NETWORK, stu_connected: false }
      ]
    }))
    const system = useSystemState()
    await system.checkState()

    expect(system.multiUnit.value).toBe(true)
    expect(system.units.value).toHaveLength(2)
    expect(system.units.value?.[0].sth_connected?.name).toBe('STH-A')
  })

  it('is multi unit without a unit, too', async () => {
    getSystemState.mockResolvedValue(state({ units: [] }))
    const system = useSystemState()
    await system.checkState()

    expect(system.multiUnit.value).toBe(true)
    expect(system.units.value).toEqual([])
  })

  it('forgets the units if the API is not reachable', async () => {
    getSystemState.mockResolvedValueOnce(state({ units: [] }))
    const system = useSystemState()
    await system.checkState()
    getSystemState.mockRejectedValueOnce(new Error('down'))
    await system.checkState()

    expect(system.units.value).toBeNull()
  })
})
