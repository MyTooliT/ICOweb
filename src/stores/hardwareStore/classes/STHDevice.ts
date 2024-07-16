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

  // Note:  This allows all standard 8-bit ASCII characters up to a length of
  //        29 characters to adhere to a common interpretation of the BTLE spec.
  //        eslint-disable-next-line max-len
  //        https://stackoverflow.com/questions/65568893/how-to-know-the-maximum-length-of-bt-name
  // eslint-disable-next-line max-len
  public static readonly nameRegex: RegExp = new RegExp('^[\x20-\x7E]{1,29}[^\\s]$');

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