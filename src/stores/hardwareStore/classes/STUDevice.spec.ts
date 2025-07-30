import {
  beforeEach,
  describe,
  expect,
  it
} from 'vitest';
import { STUDevice } from './STUDevice.ts';
import {
  TSensorNodeNumber,
  TMac,
  TName
} from './Device.ts';

describe('STU Device', () => {
  let device: STUDevice;
  const device_number: TSensorNodeNumber = 1;
  const name: TName = 'Test Device';
  const mac_address: TMac = '00:00:00:00:00:00';

  beforeEach(() => {
    device = new STUDevice(device_number, name, mac_address);
  });

  it('successfully created',  () => {
    expect(device.getName()).toBe(name)
    expect(device.getDeviceNumber()).toBe(device_number)
    expect(device.getMacAddress()).toBe(mac_address)
  });
});