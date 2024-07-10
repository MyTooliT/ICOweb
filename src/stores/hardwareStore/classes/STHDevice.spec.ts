import { beforeEach, describe, expect, it } from 'vitest';
import { MockConnection, STHDevice, TRssi } from './STHDevice.ts';
import { TId, TMac, TName } from './Device.ts';

describe('STHDevice', () => {
  let device: STHDevice;
  const id: TId = 1;
  const name: TName = 'Test Device';
  const mac: TMac = '00:00:00:00:00:00';
  const rssi: TRssi = -60;

  beforeEach(() => {
    device = new STHDevice(id, name, mac, rssi, new MockConnection());
  });

  it('correctly constructs a device', () => {
    expect(device.getId()).toBe(id);
    expect(device.getName()).toBe(name);
    expect(device.getMac()).toBe(mac);
    expect(device.getRssi()).toBe(rssi);
  });

  it('correctly sets device properties', () => {
    const newId: TId = 2;
    const newName: TName = 'New device';
    const newMac: TMac = '01:23:45:67:89:AB';
    const newRssi: TRssi = -70;

    device.setId(newId);
    device.setName(newName);
    device.setMac(newMac);
    device.setRssi(newRssi);

    expect(device.getId()).toBe(newId);
    expect(device.getName()).toBe(newName);
    expect(device.getMac()).toBe(newMac);
    expect(device.getRssi()).toBe(newRssi);
  });

  // Test async methods
  it('connects and disconnects correctly', async () => {
    expect(device.getConnection().getConnectionStatus()).toBe('disconnected')
    await expect(device.getConnection().connect()).resolves.not.toThrow();
    expect(device.getConnection().getConnectionStatus()).toBe('connected')
    await expect(device.getConnection().disconnect()).resolves.not.toThrow();
    expect(device.getConnection().getConnectionStatus()).toBe('disconnected')
  });

  it('measures correctly', async () => {
    await expect(device.getConnection().measure()).resolves.not.toThrow();
  });
});