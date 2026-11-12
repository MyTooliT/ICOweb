import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';

const MAC = '14-2D-41-D7-77-7D';

describe('applyConnectedSTH', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
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

  it('adds the device if it is not listed', () => {
    const store = useHardwareStore();

    store.applyConnectedSTH({ name: 'Test-STH', mac_address: MAC });

    expect(store.STHDeviceList).toHaveLength(1);
    expect(store.activeSTH?.getMacAddress()).toBe(MAC);
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
