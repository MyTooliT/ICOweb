import {
  disableSTUOTA,
  enableSTUOTA,
  requestSTUConnectionStatus,
  resetSTUDevice
} from '@/api/icoapi.ts';
import {
  Device,
  TDeviceConnectionStatus,
  TSensorNodeNumber,
  TMac,
  TName
} from './Device.ts';

export type TOTAState = 'enabled' | 'enabling' | 'disabled' | 'disabling'

export class STUDevice extends Device {
  private OTAState: TOTAState;
  constructor(
    device_number: TSensorNodeNumber,
    name: TName,
    mac_address: TMac,
    status: TDeviceConnectionStatus = 'disconnected',
    ota: TOTAState = 'disabled'
  ) {
    super(device_number, name, mac_address, status);
    this.OTAState = ota
  }
  public async reset(): Promise<void> {
    try {
      await resetSTUDevice()
    } catch(e) {
      throw e
    }
  }

  public async enableOTA(): Promise<void> {
    try {
      this.OTAState = 'enabling'
      await enableSTUOTA()
      this.OTAState = 'enabled'
    } catch(e) {
      throw e;
    }
  }

  public async disableOTA(): Promise<void> {
    try {
      this.OTAState = 'disabling'
      await disableSTUOTA()
      this.OTAState = 'disabled'
    } catch(e) {
      throw e;
    }
  }

  public getOTAState(): TOTAState {
    return this.OTAState
  }

  public async checkConnection() {
    try {
      this.connection_status = await requestSTUConnectionStatus()
        ? 'connected'
        : 'disconnected'
    } catch(e) {
      this.connection_status = 'disconnected'
    }
  }

  public isConnected(): boolean {
    return this.connection_status === 'connected'
  }

  public toJSON() {
    return {
      device_number: this.sensor_node_number,
      name: this.name,
      mac_address: this.mac_address,
      status: this.connection_status,
      ota: this.OTAState,
      classtype: 'STU'
    }
  }
}

