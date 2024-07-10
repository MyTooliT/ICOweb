import {
  Device,
  IConnection,
  MockConnection,
  TId,
  TMac,
  TName
} from './Device.ts';

export type TOTAState = 'enabled' | 'disabled'

export class STUDevice extends Device<ISTUActions> {
  constructor(
    id: TId,
    name: TName,
    mac: TMac,
    connection: ISTUActions = new MockSTUActions()) {
    super(id, name, mac, connection);
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

