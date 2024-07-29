import {
  Device,
  MockConnection,
  TDeviceMetaData
} from './Device.ts';
import { getSTUHealth } from '@/api/requests.ts';

export type TOTAState = 'enabled' | 'disabled'

export class STUDevice extends Device<TDeviceMetaData, ISTUActions> {
  constructor(
    meta: TDeviceMetaData,
    connection: ISTUActions = new BackendSTUActions()) {
    super(meta, connection);
  }
  public async isConnected(): Promise<boolean> {
    return this.Connection().isConnected(this.Meta().device_number)
  }
}

interface ISTUActions {
  reset(): Promise<void>;
  enableOTA(): Promise<void>;
  disableOTA(): Promise<void>;
  getOTAState(): TOTAState;
  isConnected(nr: number): Promise<boolean>;
}

export class MockSTUActions extends MockConnection implements ISTUActions {
  private otaState: TOTAState = 'disabled';
  public reset(): Promise<void> {
    this.otaState = 'disabled'
    return Promise.resolve()
  }

  public enableOTA(): Promise<void> {
    this.otaState = 'enabled'
    return Promise.resolve()
  }

  public disableOTA(): Promise<void> {
    this.otaState = 'disabled'
    return Promise.resolve()
  }

  public getOTAState(): TOTAState {
    return this.otaState
  }

  public isConnected(): Promise<boolean> {
    return Promise.resolve(true)
  }
}

export class BackendSTUActions implements ISTUActions {
  private otaState: TOTAState = 'disabled';
  public reset(): Promise<void> {
    return Promise.reject('Not Implemented');
  }

  public enableOTA(): Promise<void> {
    return Promise.reject('Not Implemented');
  }

  public disableOTA(): Promise<void> {
    return Promise.reject('Not Implemented');
  }

  public getOTAState(): TOTAState {
    return this.otaState
  }

  public async isConnected(nr: number = 1): Promise<boolean> {
    return await getSTUHealth(nr)
  }
}

