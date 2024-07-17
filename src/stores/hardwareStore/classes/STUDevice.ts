import {
  Device,
  IConnection,
  MockConnection,
  TDeviceMetaData
} from './Device.ts';

export type TOTAState = 'enabled' | 'disabled'

export class STUDevice extends Device<TDeviceMetaData, ISTUActions> {
  constructor(
    meta: TDeviceMetaData,
    connection: ISTUActions = new MockSTUActions()) {
    super(meta, connection);
  }
}

interface ISTUActions extends IConnection {
  reset(): Promise<void>;
  enableOTA(): Promise<void>;
  disableOTA(): Promise<void>;
  getOTAState(): TOTAState;
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
}

