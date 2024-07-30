import {
  Device,
  TDeviceConnectionStatus,
  TDeviceNumber,
  TMac,
  TName
} from './Device.ts';

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

  public connect(): Promise<TDeviceConnectionStatus> {
    return Promise.reject('Not Implemented');
  }
  public disconnect(): Promise<TDeviceConnectionStatus> {
    return Promise.reject('Not Implemented');
  }
  public measure(): Promise<void> {
    return Promise.reject('Not Implemented')
  }
  public getConnectionStatus(): TDeviceConnectionStatus {
    return this.connection_status;
  }
}