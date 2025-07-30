export type TSensorNodeNumber = number;
export type TName = string;
export type TMac = string;

export type TDeviceConnectionStatus
  = 'connected' | 'connecting' | 'disconnected' | 'disconnecting';

export class Device {
  protected sensor_node_number: TSensorNodeNumber
  protected name: TName
  protected mac_address: TMac
  protected connection_status: TDeviceConnectionStatus

  constructor(
    sensor_node_number: TSensorNodeNumber,
    name: TName,
    mac_address: TMac,
    status: TDeviceConnectionStatus = 'disconnected',
  ) {
    this.sensor_node_number = sensor_node_number
    this.name = name
    this.mac_address = mac_address
    this.connection_status = status
  }


  public getDeviceNumber(): TSensorNodeNumber {
    return this.sensor_node_number;
  }

  public setDeviceNumber(sensor_node_number: TSensorNodeNumber): void {
    this.sensor_node_number = sensor_node_number;
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