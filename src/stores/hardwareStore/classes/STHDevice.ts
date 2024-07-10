import { Device, TId, TMac, TName } from './Device.ts';

export type TRssi = number;
export type TSTHConnectionStatus = 'connected' | 'disconnected';

export class STHDevice extends Device {
  private rssi?: TRssi;
  private readonly connection: ISTHActions;
  // TODO: Add default sensor config

  constructor(
    id: TId,
    name: TName,
    mac: TMac,
    rssi: TRssi,
    connection: ISTHActions = new BackendConnection()) {
    super(id, name, mac)
    this.rssi = rssi;
    this.connection = connection;
  }

  public getRssi(): typeof this.rssi { return this.rssi }
  public setRssi(rssi: TRssi) {
    this.rssi = rssi;
  }

  public getConnection() {
    return this.connection;
  }
}

interface ISTHActions {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  measure(): Promise<void>;
  getConnectionStatus(): TSTHConnectionStatus;
}

export class MockConnection implements ISTHActions {
  private status: TSTHConnectionStatus = 'disconnected';
  public connect(): Promise<void> {
    this.status = 'connected'
    return Promise.resolve();
  }
  public disconnect(): Promise<void> {
    this.status = 'disconnected';
    return Promise.resolve();
  }
  public measure(): Promise<void> {
    return Promise.resolve()
  }
  public getConnectionStatus(): TSTHConnectionStatus {
    return this.status;
  }
}

class BackendConnection implements ISTHActions {
  private status: TSTHConnectionStatus = 'disconnected';
  public connect(): Promise<void> {
    return Promise.reject('Not Implemented');
  }
  public disconnect(): Promise<void> {
    return Promise.reject('Not Implemented');
  }
  public measure(): Promise<void> {
    return Promise.reject('Not Implemented')
  }
  public getConnectionStatus(): TSTHConnectionStatus {
    return this.status;
  }
}