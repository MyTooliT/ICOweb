export type TId = number;
export type TName = string;
export type TMac = string;

// TODO: Somehow test the intermediate 'connecting' state
export type TDeviceConnectionStatus
  = 'connected' | 'connecting' | 'disconnected';


/**
 * Represents a Device.
 * @template ActionType - The type of the device's connection.
 * THIS SHOULD NEVER BE INSTANTIATED EXCEPT FOR TESTING
 */
export class Device<ActionType> {
  private id: TId;
  protected name: TName;
  private mac: TMac;
  private readonly connection: ActionType;

  constructor(
    id: TId,
    name: TName,
    mac: TMac,
    connection: ActionType) {
    this.id = id;
    this.name = name;
    this.mac = mac;
    this.connection = connection;
  }

  public getId(): typeof this.id { return this.id }
  public setId(id: number) {this.id = id}

  public getName(): typeof this.name { return this.name }
  public setName(name: string): Promise<boolean> {
    this.name = name
    return Promise.resolve(true);
  }

  public getMac(): typeof this.mac { return this.mac }
  public setMac(mac: TMac) {
    // TODO: Add regex check for MAC address
    this.mac = mac;
  }

  public getConnection(): ActionType {
    return this.connection;
  }
}

export interface IConnection {
  connect(): Promise<TDeviceConnectionStatus>;
  disconnect(): Promise<TDeviceConnectionStatus>;
  getConnectionStatus(): TDeviceConnectionStatus;
}

export class MockConnection {
  private status: TDeviceConnectionStatus = 'disconnected';
  public connect(): Promise<TDeviceConnectionStatus> {
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