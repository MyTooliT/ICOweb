export type TDeviceNumber = number;
export type TName = string;
export type TMac = string;

// TODO: Somehow test the intermediate 'connecting' state
export type TDeviceConnectionStatus
  = 'connected' | 'connecting' | 'disconnected';

export type TDeviceMetaData = {
  device_number: TDeviceNumber;
  name: TName;
  mac_address: TMac;
}

/**
 * Represents a Device.
 * @template Metatype - The type of the device's metadata, fetched via API.
 * @template ActionType - The type of the device's connection.
 * THIS SHOULD NEVER BE INSTANTIATED EXCEPT FOR TESTING
 */
export class Device<MetaType, ActionType> {
  private readonly meta: MetaType;
  private readonly connection: ActionType;

  constructor(
    meta: MetaType,
    connection: ActionType) {
    this.meta = meta;
    this.connection = connection;
  }
  public Connection(): ActionType {
    return this.connection;
  }
  public Meta(): MetaType {
    return this.meta;
  }
}

export interface IConnection {
  connect(): Promise<TDeviceConnectionStatus>;
  disconnect(): Promise<TDeviceConnectionStatus>;
  getConnectionStatus(): TDeviceConnectionStatus;
}

export class MockConnection {
  private status: TDeviceConnectionStatus = 'disconnected';
  public async connect(): Promise<TDeviceConnectionStatus> {
    this.status = 'connecting'
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.status = 'connected'
    return Promise.resolve('connected')
  }
  public disconnect(): Promise<TDeviceConnectionStatus> {
    this.status = 'disconnected';
    return Promise.resolve('disconnected');
  }
  public getConnectionStatus(): TDeviceConnectionStatus {
    return this.status;
  }
}