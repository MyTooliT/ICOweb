export type TDeviceNumber = number;
export type TName = string;
export type TMac = string;

export type TDeviceConnectionStatus
  = 'connected' | 'connecting' | 'disconnected';

export class Device {
  protected device_number: TDeviceNumber
  protected name: TName
  protected mac_address: TMac
  protected connection_status: TDeviceConnectionStatus

  constructor(
    device_number: TDeviceNumber,
    name: TName,
    mac_address: TMac,
    status: TDeviceConnectionStatus = 'disconnected',
  ) {
    this.device_number = device_number
    this.name = name
    this.mac_address = mac_address
    this.connection_status = status
  }


  public getDeviceNumber(): TDeviceNumber {
    return this.device_number;
  }

  public setDeviceNumber(device_number: TDeviceNumber): void {
    this.device_number = device_number;
  }

  public getName(): TName {
    return this.name;
  }

  public setName(name: TName): void {
    this.name = name;
  }

  public getMacAddress(): TMac {
    return this.mac_address;
  }

  public setMacAddress(mac_address: TMac): void {
    this.mac_address = mac_address;
  }

  public getConnectionStatus(): TDeviceConnectionStatus {
    return this.connection_status;
  }

  public setConnectionStatus(status: TDeviceConnectionStatus): void {
    this.connection_status = status;
  }
}