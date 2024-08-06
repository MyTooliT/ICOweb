import {
  Device,
  TDeviceConnectionStatus,
  TDeviceNumber,
  TMac,
  TName
} from './Device.ts';
import { resetSTUDevice } from '@/api/requests.ts';

export type TOTAState = 'enabled' | 'disabled'

export class STUDevice extends Device {
  private OTAState: TOTAState;
  constructor(
    device_number: TDeviceNumber,
    name: TName,
    mac_address: TMac,
    status: TDeviceConnectionStatus = 'disconnected',
    ota: TOTAState = 'disabled'
  ) {
    super(device_number, name, mac_address, status);
    this.OTAState = ota
  }
  public async reset(): Promise<void> {
    await resetSTUDevice(this.name)
  }

  public enableOTA(): Promise<void> {
    return Promise.reject('Not Implemented');
  }

  public disableOTA(): Promise<void> {
    return Promise.reject('Not Implemented');
  }

  public getOTAState(): TOTAState {
    return this.OTAState
  }
}
