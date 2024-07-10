import { describe, expect, it } from 'vitest';
import { MockSTHActions, STHDevice, TRssi } from './STHDevice.ts';

describe('STHDevice', () => {
  const rssi: TRssi = -60;
  const device: STHDevice
    = new STHDevice(1, 'Test', 'mac', rssi, new MockSTHActions());

  it('correctly sets and gets rssi', () => {
    expect(device.getRssi()).toBe(rssi)
    device.setRssi(-72);
    expect(device.getRssi()).toBe(-72)
  })

  it('measures correctly', async () => {
    await expect(device.getConnection().measure()).resolves.not.toThrow()
  });
});