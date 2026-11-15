import {
  disableSTUOTA,
  enableSTUOTA,
  requestSTUConnectionStatus,
  resetSTUDevice
} from '@/api/icoapi.ts';
import {
  Device,
  TDeviceConnectionStatus,
  TDeviceNumber,
  TMac,
  TName
} from './Device.ts';

export type TOTAState = 'enabled' | 'enabling' | 'disabled' | 'disabling'

export class STUDevice extends Device {
  private OTAState: TOTAState;
  /** Unit (CAN network) of the STU, `null` without multi STU support */
  public readonly unit: string | null;
  constructor(
    device_number: TDeviceNumber,
    name: TName,
    mac_address: TMac,
    status: TDeviceConnectionStatus = 'disconnected',
    ota: TOTAState = 'disabled',
    unit: string | null = null
  ) {
    super(device_number, name, mac_address, status);
    this.OTAState = ota
    this.unit = unit
  }
  public async reset(): Promise<void> {
    try {
      await resetSTUDevice(this.unit)
    } catch(e) {
      throw e
    }
  }

  public async enableOTA(): Promise<void> {
    try {
      this.OTAState = 'enabling'
      await enableSTUOTA(this.unit)
      this.OTAState = 'enabled'
    } catch(e) {
      throw e;
    }
  }

  public async disableOTA(): Promise<void> {
    try {
      this.OTAState = 'disabling'
      await disableSTUOTA(this.unit)
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
      this.connection_status = await requestSTUConnectionStatus(this.unit)
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
      device_number: this.device_number,
      name: this.name,
      mac_address: this.mac_address,
      status: this.connection_status,
      ota: this.OTAState,
      unit: this.unit,
      classtype: 'STU'
    }
  }
}

