import {
  Device,
  IConnection,
  MockConnection,
  TDeviceConnectionStatus,
  TDeviceMetaData
} from './Device.ts';

import { delay } from '@/api/requests.ts';

export type TRssi = number;

export type TSTHDeviceMetaData = TDeviceMetaData & {
  rssi: TRssi;
}

export class STHDevice extends Device<TSTHDeviceMetaData, ISTHActions> {
  // TODO: Add default sensor config

  constructor(
    meta: TSTHDeviceMetaData,
    connection: ISTHActions = new BackendSTHActions()
  ) {
    super(meta, connection)
  }

  public regex = new RegExp('^[\x20-\x7E]{1,29}[^\\s]$')

  public getRssi(): TRssi { return this.Meta().rssi }
  public getRssiRepr(): string {
    return `${this.Meta().rssi}dB`;
  }
  public setRssi(rssi: TRssi) {
    this.Meta().rssi = rssi;
  }

  public async setName(name: string): Promise<void> {
    await delay()
    this.Meta().name = name;
  }

  public async measure(): Promise<void> {
    return this.Connection().measure()
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

export class BackendSTHActions implements ISTHActions {
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