import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';

const MAC = '14-2D-41-D7-77-7D';

describe('applyConnectedSTH', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('marks the connected device after a reload lost the status', () => {
    const store = useHardwareStore();
    store.STHDeviceList = [
      new STHDevice(1, 'Other', '00-00-00-00-00-01', -50, ''),
      new STHDevice(2, 'Test-STH', MAC, -40, '')
    ];

    store.applyConnectedSTH({ name: 'Test-STH', mac_address: MAC });

    expect(store.activeSTH?.getMacAddress()).toBe(MAC);
    expect(store.STHDeviceList[0].isConnected()).toBe(false);
  });

  it('ignores the MAC address format', () => {
    const store = useHardwareStore();
    store.STHDeviceList = [new STHDevice(2, 'Test-STH', MAC, -40, '')];

    store.applyConnectedSTH({
      name: 'Test-STH', mac_address: '14:2d:41:d7:77:7d'
    });

    expect(store.activeSTH).toBeDefined();
  });

  it('falls back to the name if the MAC differs', () => {
    const store = useHardwareStore();
    store.STHDeviceList = [
      new STHDevice(1, 'Other', '00-00-00-00-00-01', -50, ''),
      new STHDevice(2, 'Test-STH', MAC, -40, '')
    ];

    store.applyConnectedSTH({
      name: 'Test-STH', mac_address: '14-2D-41-D7-77-7E'
    });

    expect(store.STHDeviceList).toHaveLength(2);
    expect(store.activeSTH?.getName()).toBe('Test-STH');
  });

  it('never invents a device', () => {
    const store = useHardwareStore();
    store.STHDeviceList = [
      new STHDevice(1, 'Other', '00-00-00-00-00-01', -50, '', 'connected')
    ];

    store.applyConnectedSTH({ name: 'Test-STH', mac_address: MAC });

    expect(store.STHDeviceList).toHaveLength(1);
    expect(store.STHDeviceList[0].isConnected()).toBe(true);
  });

  it('disconnects everything if the API has no connection', () => {
    const store = useHardwareStore();
    store.STHDeviceList = [
      new STHDevice(2, 'Test-STH', MAC, -40, '', 'connected')
    ];

    store.applyConnectedSTH(null);

    expect(store.activeSTH).toBeUndefined();
  });
});
