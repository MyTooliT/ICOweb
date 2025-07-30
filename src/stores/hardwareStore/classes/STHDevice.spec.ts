import {
  describe,
  expect,
  it
} from 'vitest';
import { STHDevice } from './STHDevice.ts';

describe('STHDevice', () => {
  const device: STHDevice = new STHDevice(
    1,
    'STH 1',
    'AA:BB:CC:DD:EE:FF',
    0);

  it('correctly sets and gets metadata', () => {
    device.setMetadata({
      sensor_node_number: 2,
      name: 'New Name',
      mac_address: '11:22:33:44:55:66',
      rssi: 10
    })
    expect(JSON.stringify(device)).toStrictEqual('{"device_number":2,"name":"New Name","mac_address":"11:22:33:44:55:66","connection_status":"disconnected","regex":{},"rssi":10}')
  })
});