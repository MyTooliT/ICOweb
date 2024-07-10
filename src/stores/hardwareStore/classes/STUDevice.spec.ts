import { beforeEach, describe, expect, it } from 'vitest';
import { MockSTUActions, STUDevice } from './STUDevice.ts';
import { TId, TMac, TName } from './Device.ts';

describe('device', () => {
  let device: STUDevice;
  const id: TId = 1;
  const name: TName = 'Test Device';
  const mac: TMac = '00:00:00:00:00:00';
  const mockSTUActions = new MockSTUActions();

  beforeEach(() => {
    device = new STUDevice(id, name, mac, mockSTUActions);
  });

  it('should perform OTA operations correctly', async () => {
    expect(device.getConnection().getOTAState()).toBe('disabled');

    await device.getConnection().enableOTA();
    expect(device.getConnection().getOTAState()).toBe('enabled');

    await device.getConnection().disableOTA();
    expect(device.getConnection().getOTAState()).toBe('disabled');

    await device.getConnection().reset();
    expect(device.getConnection().getOTAState()).toBe('disabled');
  });
});