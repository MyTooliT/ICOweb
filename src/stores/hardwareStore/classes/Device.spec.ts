import { beforeEach, describe, expect, it } from 'vitest';
import {
  Device,
  IConnection,
  MockConnection,
  TId,
  TMac,
  TName
} from './Device.ts';

describe('Device', () => {
  let device: Device<IConnection>;
  const id: TId = 1;
  const name: TName = 'Test Device';
  const mac: TMac = '00:00:00:00:00:00';

  beforeEach(() => {
    device = new Device(id, name, mac, new MockConnection());
  });

  it('correctly constructs a device', () => {
    expect(device.getId()).toBe(id);
    expect(device.getName()).toBe(name);
    expect(device.getMac()).toBe(mac);
  });

  it('correctly sets device properties', () => {
    const newId: TId = 2;
    const newName: TName = 'New device';
    const newMac: TMac = '01:23:45:67:89:AB';

    device.setId(newId);
    device.setName(newName);
    device.setMac(newMac);

    expect(device.getId()).toBe(newId);
    expect(device.getName()).toBe(newName);
    expect(device.getMac()).toBe(newMac);
  });

  it('connects and disconnects correctly', async () => {
    expect(device.getConnection().getConnectionStatus()).toBe('disconnected')
    await expect(device.getConnection().connect()).resolves.not.toThrow();
    expect(device.getConnection().getConnectionStatus()).toBe('connected')
    await expect(device.getConnection().disconnect()).resolves.not.toThrow();
    expect(device.getConnection().getConnectionStatus()).toBe('disconnected')
  });
});