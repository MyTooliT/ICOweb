import {
  Device,
  TDeviceConnectionStatus,
  TDeviceNumber,
  TMac,
  TName
} from './Device.ts';
import {
  connectSTHDevice,
  disconnectSTHDevice
} from '@/api/requests.ts';

export type TRssi = number;

export class STHDevice extends Device {
  // TODO: Add default sensor config
  private readonly regex = new RegExp('^[\x20-\x7E]{1,29}[^\\s]$')
  private rssi: number = 0;

  constructor(
    device_number: TDeviceNumber,
    name: TName,
    mac_address: TMac,
    rssi: number,
    status: TDeviceConnectionStatus = 'disconnected',
    regex: RegExp = new RegExp('^[\x20-\x7E]{1,29}[^\\s]$'),
  ) {
    super(device_number, name, mac_address, status)
    this.regex = regex
    this.rssi = rssi
  }

  public getRssiRepr(): string {
    return `${this.rssi}dB`;
  }

  public getRegex(): RegExp {
    return this.regex
  }

  public setName(name: string): boolean {
    if(this.regex.test(name)) {
      this.name = name;
      return true
    }
    return false
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

  public dump() {

  }

  public async connect(): Promise<void> {
    this.connection_status = 'connecting'
    try {
      await connectSTHDevice(this.mac_address)
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
  public measure(): Promise<void> {
    return Promise.reject('Not Implemented')
  }
  public getConnectionStatus(): TDeviceConnectionStatus {
    return this.connection_status;
  }
}