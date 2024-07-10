export type TId = number;
export type TName = string;
export type TMac = string;

export class Device {
  id: TId;
  name: TName;
  mac: TMac;

  constructor(id: TId, name: TName, mac: TMac) {
    this.id = id;
    this.name = name;
    this.mac = mac;
  }

  public getId(): typeof this.id { return this.id }
  public setId(id: number) {this.id = id}

  public getName(): typeof this.name { return this.name }
  public setName(name: string) {
    // TODO: Add checks for maxlength & characters
    this.name = name
  }

  public getMac(): typeof this.mac { return this.mac }
  public setMac(mac: TMac) {
    // TODO: Add regex check for MAC address
    this.mac = mac;
  }
}