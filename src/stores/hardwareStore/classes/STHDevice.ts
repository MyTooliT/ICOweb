import {
  connectSTHDevice,
  disconnectSTHDevice, getSupplyVoltage,
  renameSTHDevice
} from '@/api/icoapi.ts';
import {
  Device,
  TDeviceConnectionStatus,
  TDeviceNumber,
  TMac,
  TName
} from './Device.ts';
import {SupplyVoltageResponseModel} from '@/client';

export type TRssi = number;

export class STHDevice extends Device {
  public static readonly regex = new RegExp('^[\x20-\x7E]{1,8}[^\\s]$')
  private rssi: number = 0;
  public supplyVoltage: SupplyVoltageResponseModel | null = null;
  public holderConfigId: string | undefined = undefined;

  constructor(
    device_number: TDeviceNumber,
    name: TName,
    mac_address: TMac,
    rssi: number,
    holderConfigId: string,
    status: TDeviceConnectionStatus = 'disconnected',
    supplyVoltage: SupplyVoltageResponseModel | null = null
  ) {
    super(device_number, name, mac_address, status)
    this.rssi = rssi
    this.holderConfigId = holderConfigId
    this.supplyVoltage = supplyVoltage
  }

  public getRssiRepr(): string {
    return `${this.rssi}dB`;
  }

  public getSupplyVoltageRepr(): string {
    return this.supplyVoltage
        ? `${this.supplyVoltage?.supply_voltage.toFixed(2)}${this.supplyVoltage.unit}`
        : 'N/A'
  }

  public async setName(name: string): Promise<void> {
    if(STHDevice.regex.test(name)) {
      try {
        const response = await renameSTHDevice({
          new_name: name,
          mac_address: this.mac_address
        })
        this.name = response.name
      } catch(e) {
        throw e
      }
    }
  }

  public setMetadata(body: {
    device_number: TDeviceNumber,
    name: TName,
    mac_address: TMac,
    rssi: TRssi
  }): void {
    this.device_number = body.device_number;
    this.name = body.name;
    this.mac_address = body.mac_address;
    this.rssi = body.rssi
  }

  public async connect(): Promise<void> {
    this.connection_status = 'connecting'
    try {
      await connectSTHDevice(this.mac_address)
      await this.requestSupplyVoltage()
      this.connection_status = 'connected';
    } catch(e) {
      this.connection_status = 'disconnected';
      throw e
    }
  }
  public async disconnect(): Promise<void> {
    this.connection_status = 'disconnecting'
    try {
      await disconnectSTHDevice()
      this.connection_status = 'disconnected';
    } catch(e) {
      this.connection_status = 'connected';
      throw e
    }
  }
  public isConnected(): boolean {
    return this.connection_status === 'connected'
  }
  public measure(): Promise<void> {
    return Promise.reject('Not Implemented')
  }
  public getConnectionStatus(): TDeviceConnectionStatus {
    return this.connection_status;
  }

  public async requestSupplyVoltage(): Promise<void> {
    this.supplyVoltage = await getSupplyVoltage()
  }

  public toJSON() {
    return {
      device_number: this.device_number,
      name: this.name,
      mac_address: this.mac_address,
      rssi: this.rssi,
      holderConfigId: this.holderConfigId,
      status: this.connection_status,
      supplyVoltage: this.supplyVoltage,
      classtype: 'STH'
    }
  }
}