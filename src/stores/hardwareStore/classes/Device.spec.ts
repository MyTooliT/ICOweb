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
  TDeviceNumber,
  TMac,
  TName
} from './Device.ts';

describe('Device', () => {
  let device: Device<TDeviceMetaData, IConnection>;
  const device_number: TDeviceNumber = 1;
  const name: TName = 'Test Device';
  const mac_address: TMac = '00:00:00:00:00:00';

  beforeEach(() => {
    device = new Device({
      device_number: device_number, name: name, mac_address: mac_address
    }, new MockConnection());
  });

  it('correctly constructs a device', () => {
    expect(device.Meta().device_number).toBe(device_number);
    expect(device.Meta().name).toBe(name);
    expect(device.Meta().mac_address).toBe(mac_address);
  });

  it('correctly sets device properties', () => {
    const newDeviceNumber: TDeviceNumber = 2;
    const newName: TName = 'New device';
    const newMac: TMac = '01:23:45:67:89:AB';

    device.Meta().device_number = newDeviceNumber;
    device.Meta().name = newName;
    device.Meta().mac_address = newMac;

    expect(device.Meta().device_number).toBe(newDeviceNumber);
    expect(device.Meta().name).toBe(newName);
    expect(device.Meta().mac_address).toBe(newMac);
  });

  it('connects and disconnects correctly', async () => {
    expect(device.Connection().getConnectionStatus()).toBe('disconnected')
    await expect(device.Connection().connect()).resolves.not.toThrow();
    expect(device.Connection().getConnectionStatus()).toBe('connected')
    await expect(device.Connection().disconnect()).resolves.not.toThrow();
    expect(device.Connection().getConnectionStatus()).toBe('disconnected')
  });
});