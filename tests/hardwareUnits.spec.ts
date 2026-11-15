import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSTHDevicesMeta = vi.fn()
const getSTUDevices = vi.fn()
const connectSTHDevice = vi.fn()
vi.mock('@/api/icoapi.ts', () => ({
  getSTHDevicesMeta: (unit: any) => getSTHDevicesMeta(unit),
  getSTUDevices: (unit: any) => getSTUDevices(unit),
  connectSTHDevice: (mac: string, unit: any) => connectSTHDevice(mac, unit),
  getSupplyVoltage: () => Promise.resolve({
    supply_voltage: 3.9, unit: 'V', indication: null, timestamp_utc_iso: ''
  }),
  getSensorInformation: () => Promise.resolve({
    sensors: [], configurations: [], default_configuration_id: ''
  })
}))

import { STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';
import { HolderConfig } from '@/stores/hardwareStore/classes/HolderConfig.ts';
import { STUDevice } from '@/stores/hardwareStore/classes/STUDevice.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';

const UNIT_1 = 'pcan:PCAN_USBBUS1'
const UNIT_2 = 'pcan:PCAN_USBBUS2'
const MAC_1 = '14-2D-41-D7-77-7D'
const MAC_2 = '14-2D-41-D7-77-7E'
const NETWORK = { interface: 'pcan', channel: 'x', bitrate: 1000000 }

describe('hardware store with several units', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    getSTHDevicesMeta.mockReset()
    getSTUDevices.mockReset()
    connectSTHDevice.mockReset()
  })

  it('loads the sensor devices of one unit and keeps the others', async () => {
    const store = useHardwareStore()
    store.STHDeviceList = [
      new STHDevice(1, 'Other-A', '00-00-00-00-00-01', -50, '', 'disconnected', null, UNIT_1)
    ]
    getSTHDevicesMeta.mockResolvedValue([
      { device_number: 1, name: 'Other-B', mac_address: MAC_2, rssi: -40 }
    ])

    await store.updateSTHDeviceList('default', UNIT_2)

    expect(getSTHDevicesMeta).toHaveBeenCalledWith(UNIT_2)
    expect(store.sthListFor(UNIT_1).map(d => d.getName())).toEqual(['Other-A'])
    expect(store.sthListFor(UNIT_2).map(d => d.getName())).toEqual(['Other-B'])
    expect(store.sthListFor(UNIT_2)[0].unit).toBe(UNIT_2)
  })

  it('reloads the devices of a unit without losing their settings', async () => {
    const store = useHardwareStore()
    // A device keeps its holder, as long as the holder exists
    store.holderList = [new HolderConfig('Holder', 'holder-1', [])]
    const device = new STHDevice(1, 'Test-STH', MAC_1, -50, 'holder-1', 'disconnected', null, UNIT_1)
    store.STHDeviceList = [device]
    getSTHDevicesMeta.mockResolvedValue([
      { device_number: 1, name: 'Test-STH', mac_address: MAC_1, rssi: -42 }
    ])

    await store.updateSTHDeviceList('default', UNIT_1)

    expect(store.sthListFor(UNIT_1)).toHaveLength(1)
    expect(store.sthListFor(UNIT_1)[0].holderConfigId).toBe('holder-1')
  })

  it('loads the STU of one unit and keeps the others', async () => {
    const store = useHardwareStore()
    store.STUDeviceList = [new STUDevice(1, 'STU-A', 'a', 'disconnected', 'disabled', UNIT_1)]
    getSTUDevices.mockResolvedValue([{ device_number: 1, name: 'STU-B', mac_address: 'b' }])

    await store.updateSTUDeviceList(UNIT_2)

    expect(store.stuListFor(UNIT_1).map(d => d.getName())).toEqual(['STU-A'])
    expect(store.stuListFor(UNIT_2).map(d => d.getName())).toEqual(['STU-B'])
    expect(store.stuListFor(UNIT_2)[0].unit).toBe(UNIT_2)
  })

  it('follows the sensor device of every unit', () => {
    const store = useHardwareStore()
    store.STHDeviceList = [
      new STHDevice(1, 'STH-A', MAC_1, -50, '', 'disconnected', null, UNIT_1),
      new STHDevice(2, 'STH-B', MAC_2, -50, '', 'disconnected', null, UNIT_2)
    ]

    store.applyConnectedSTHs([
      { unit: UNIT_1, network: NETWORK, stu_connected: true, sth_connected: { name: 'STH-A', mac_address: MAC_1 } },
      { unit: UNIT_2, network: NETWORK, stu_connected: true, sth_connected: { name: 'STH-B', mac_address: MAC_2 } }
    ])

    expect(store.activeSTHs.map(d => d.getName())).toEqual(['STH-A', 'STH-B'])
    expect(store.activeSTHFor(UNIT_2)?.getName()).toBe('STH-B')
  })

  it('does not mix up the sensor devices of two units', () => {
    const store = useHardwareStore()
    // The same device is visible to both STUs
    store.STHDeviceList = [
      new STHDevice(1, 'STH-A', MAC_1, -50, '', 'disconnected', null, UNIT_1),
      new STHDevice(1, 'STH-A', MAC_1, -60, '', 'disconnected', null, UNIT_2)
    ]

    store.applyConnectedSTHs([
      { unit: UNIT_1, network: NETWORK, stu_connected: true, sth_connected: { name: 'STH-A', mac_address: MAC_1 } },
      { unit: UNIT_2, network: NETWORK, stu_connected: true, sth_connected: null }
    ])

    expect(store.activeSTHFor(UNIT_1)).toBeDefined()
    expect(store.activeSTHFor(UNIT_2)).toBeUndefined()
  })

  it('disconnects the devices of units that are gone', () => {
    const store = useHardwareStore()
    store.STHDeviceList = [
      new STHDevice(1, 'STH-A', MAC_1, -50, '', 'connected', null, UNIT_1),
      new STHDevice(2, 'STH-B', MAC_2, -50, '', 'connected', null, UNIT_2)
    ]

    store.applyConnectedSTHs([
      { unit: UNIT_1, network: NETWORK, stu_connected: true, sth_connected: { name: 'STH-A', mac_address: MAC_1 } }
    ])

    expect(store.activeSTHs.map(d => d.getName())).toEqual(['STH-A'])
  })

  it('forgets everything of units that are gone', () => {
    const store = useHardwareStore()
    store.STUDeviceList = [
      new STUDevice(1, 'STU-A', 'a', 'disconnected', 'disabled', UNIT_1),
      new STUDevice(1, 'STU-B', 'b', 'disconnected', 'disabled', UNIT_2)
    ]
    store.STHDeviceList = [
      new STHDevice(1, 'STH-B', MAC_2, -50, '', 'disconnected', null, UNIT_2)
    ]

    store.forgetUnitsExcept([UNIT_1])

    expect(store.STUDeviceList.map(d => d.getName())).toEqual(['STU-A'])
    expect(store.STHDeviceList).toHaveLength(0)
  })

  it('talks to the unit of the device', async () => {
    const device = new STHDevice(1, 'STH-A', MAC_1, -50, '', 'disconnected', null, UNIT_2)
    connectSTHDevice.mockResolvedValue(undefined)

    await device.connect()

    expect(connectSTHDevice).toHaveBeenCalledWith(MAC_1, UNIT_2)
  })

  it('works without units like before', async () => {
    const store = useHardwareStore()
    getSTHDevicesMeta.mockResolvedValue([
      { device_number: 1, name: 'STH-A', mac_address: MAC_1, rssi: -50 }
    ])

    await store.updateSTHDeviceList('default')

    expect(getSTHDevicesMeta).toHaveBeenCalledWith(null)
    expect(store.STHDeviceList).toHaveLength(1)
    expect(store.STHDeviceList[0].unit).toBeNull()
    expect(store.sthListFor(null)).toHaveLength(1)
  })

  it('keeps the unit when devices are restored from storage', () => {
    const device = new STHDevice(1, 'STH-A', MAC_1, -50, 'h', 'disconnected', null, UNIT_2)
    expect(JSON.parse(JSON.stringify(device)).unit).toBe(UNIT_2)
    const stu = new STUDevice(1, 'STU-A', 'a', 'disconnected', 'disabled', UNIT_2)
    expect(JSON.parse(JSON.stringify(stu)).unit).toBe(UNIT_2)
  })

  it('keeps the STUs of all units if they are loaded at the same time', async () => {
    // A page refresh loads the units from two places at once
    const store = useHardwareStore()
    const answers: Record<string, (value: unknown) => void> = {}
    getSTUDevices.mockImplementation((unit: string) =>
      new Promise(resolve => { answers[unit] = resolve }))

    const first = store.updateSTUDeviceList(UNIT_1)
    const second = store.updateSTUDeviceList(UNIT_2)
    answers[UNIT_2]([{ device_number: 1, name: 'STU-2', mac_address: MAC_2 }])
    await second
    answers[UNIT_1]([{ device_number: 1, name: 'STU-1', mac_address: MAC_1 }])
    await first

    expect(store.stuListFor(UNIT_1).map(stu => stu.getName())).toEqual(['STU-1'])
    expect(store.stuListFor(UNIT_2).map(stu => stu.getName())).toEqual(['STU-2'])
  })

  it('loads the STU of a unit once, also if it is asked for twice', async () => {
    const store = useHardwareStore()
    getSTUDevices.mockResolvedValue(
      [{ device_number: 1, name: 'STU-1', mac_address: MAC_1 }])

    await Promise.all([
      store.updateSTUDeviceList(UNIT_1), store.updateSTUDeviceList(UNIT_1)
    ])

    expect(getSTUDevices).toHaveBeenCalledTimes(1)
    expect(store.stuListFor(UNIT_1)).toHaveLength(1)
  })
})
