import {
  describe,
  expect,
  it
} from 'vitest';
import {
  MockSTHActions,
  STHDevice
} from './STHDevice.ts';

describe('STHDevice', () => {
  const device: STHDevice = new STHDevice({
    id: 1,
    name: 'STH 1',
    mac: 'AA:BB:CC:DD:EE:FF',
    rssi: -60,
    regex: new RegExp('^[\x20-\x7E]{1,29}[^\\s]$')
  }, new MockSTHActions());

  it('correctly sets and gets rssi', () => {
    expect(device.getRssi()).toBe(-60)
    device.setRssi(-72);
    expect(device.getRssi()).toBe(-72)
  })

  it('measures correctly', async () => {
    await expect(device.measure()).resolves.not.toThrow()
  });
});