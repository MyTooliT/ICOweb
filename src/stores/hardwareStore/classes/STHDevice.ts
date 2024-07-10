import {
  Device,
  IConnection,
  MockConnection,
  TDeviceConnectionStatus,
  TId,
  TMac,
  TName
} from './Device.ts';

export type TRssi = number;

export class STHDevice extends Device<ISTHActions> {
  private rssi: TRssi;
  // TODO: Add default sensor config

  constructor(
    id: TId,
    name: TName,
    mac: TMac,
    rssi: TRssi,
    connection: ISTHActions = new BackendSTHActions()) {
    super(id, name, mac, connection)
    this.rssi = rssi;
  }

  public getRssi(): typeof this.rssi { return this.rssi }
  public setRssi(rssi: TRssi) {
    this.rssi = rssi;
  }
}

export interface ISTHActions extends IConnection{
  measure(): Promise<void>;
}

export class MockSTHActions extends MockConnection implements ISTHActions {
  public measure(): Promise<void> {
    return Promise.resolve()
  }
}

class BackendSTHActions implements ISTHActions {
  private status: TDeviceConnectionStatus = 'disconnected';
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
    return this.status;
  }
}