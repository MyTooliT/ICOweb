import {
  beforeEach,
  describe,
  expect,
  it
} from 'vitest';
import {
  Device,
  IConnection,
  MockConnection,
  TDeviceMetaData,
  TId,
  TMac,
  TName
} from './Device.ts';

describe('Device', () => {
  let device: Device<TDeviceMetaData, IConnection>;
  const id: TId = 1;
  const name: TName = 'Test Device';
  const mac: TMac = '00:00:00:00:00:00';

  beforeEach(() => {
    device = new Device({
      id: id, name: name, mac: mac
    }, new MockConnection());
  });

  it('correctly constructs a device', () => {
    expect(device.Meta().id).toBe(id);
    expect(device.Meta().name).toBe(name);
    expect(device.Meta().mac).toBe(mac);
  });

  it('correctly sets device properties', () => {
    const newId: TId = 2;
    const newName: TName = 'New device';
    const newMac: TMac = '01:23:45:67:89:AB';

    device.Meta().id = newId;
    device.Meta().name = newName;
    device.Meta().mac = newMac;

    expect(device.Meta().id).toBe(newId);
    expect(device.Meta().name).toBe(newName);
    expect(device.Meta().mac).toBe(newMac);
  });

  it('connects and disconnects correctly', async () => {
    expect(device.Connection().getConnectionStatus()).toBe('disconnected')
    await expect(device.Connection().connect()).resolves.not.toThrow();
    expect(device.Connection().getConnectionStatus()).toBe('connected')
    await expect(device.Connection().disconnect()).resolves.not.toThrow();
    expect(device.Connection().getConnectionStatus()).toBe('disconnected')
  });
});