import {
  beforeEach,
  describe,
  expect,
  it
} from 'vitest';
import {
  MockSTUActions,
  STUDevice
} from './STUDevice.ts';
import {
  TId,
  TMac,
  TName
} from './Device.ts';

describe('device', () => {
  let device: STUDevice;
  const id: TId = 1;
  const name: TName = 'Test Device';
  const mac: TMac = '00:00:00:00:00:00';
  const mockSTUActions = new MockSTUActions();

  beforeEach(() => {
    device = new STUDevice({
      id: id, name: name, mac: mac
    }, mockSTUActions);
  });

  it('should perform OTA operations correctly', async () => {
    expect(device.Connection().getOTAState()).toBe('disabled');

    await device.Connection().enableOTA();
    expect(device.Connection().getOTAState()).toBe('enabled');

    await device.Connection().disableOTA();
    expect(device.Connection().getOTAState()).toBe('disabled');

    await device.Connection().reset();
    expect(device.Connection().getOTAState()).toBe('disabled');
  });
});