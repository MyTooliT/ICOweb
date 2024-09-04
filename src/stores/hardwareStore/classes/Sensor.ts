export type TPhysicalDimension = string;
export type TPhysicalUnit = string;
export type TBound = number;

export class Sensor {
  public sensorType: SensorType
  private readonly sensorRange: SensorRange;
  public expose: boolean
  public channel: number
  private name: string

  constructor(
    physicalDimension: TPhysicalDimension,
    physicalUnit: TPhysicalUnit,
    lowerBound: TBound,
    upperBound: TBound,
    expose: boolean = true,
    channel: number,
    name: string
  ) {
    this.sensorType = new SensorType(physicalDimension, physicalUnit);
    this.sensorRange = new SensorRange(physicalUnit, lowerBound, upperBound);
    this.expose = expose;
    this.channel = channel;
    this.name = name;
  }

  public getSensorRange(): SensorRange { return this.sensorRange; }

  public getChannel(): number {
    return this.channel;
  }

  public setChannel(channel: number): void {
    this.channel = channel;
  }

  public getName(): string {
    return this.name;
  }

  public setName(name: string): void {
    this.name = name;
  }

  public getRangeRepr(): string {
    if(this.sensorType.physicalUnit === '-') return '-'
    return this.sensorRange.isSymmetric() ?
      `+-${this.sensorRange.upperBound}${this.sensorType.physicalUnit}` :
      // eslint-disable-next-line max-len
      `${this.sensorRange.lowerBound}-${this.sensorRange.upperBound}${this.sensorType.physicalUnit}`
  }


  public toJSON() {
    return {
      physicalDimension: this.sensorType.physicalDimension,
      physicalUnit: this.sensorType.physicalUnit,
      lowerBound: this.sensorRange.getLowerBound(),
      upperBound: this.sensorRange.getUpperBound(),
      expose: this.expose,
      channel: this.channel,
      name: this.name,
      classtype: 'Sensor'
    }
  }
}

export class SensorRange {
  public physicalUnit: TPhysicalUnit;
  public lowerBound: TBound;
  public upperBound: TBound;
  public isSymmetricThreshold: number;

  constructor(
    physicalUnit: TPhysicalUnit,
    lowerBound: TBound,
    upperBound: TBound,
    isSymmetricThreshold: number = 0.001
  ) {
    this.physicalUnit = physicalUnit;
    this.lowerBound = lowerBound;
    this.upperBound = upperBound;
    this.isSymmetricThreshold = isSymmetricThreshold;
  }

  public getPhysicalUnit(): TPhysicalUnit {
    return this.physicalUnit;
  }

  public setPhysicalUnit(physicalUnit: TPhysicalUnit): void {
    this.physicalUnit = physicalUnit;
  }

  public getLowerBound(): TBound {
    return this.lowerBound;
  }

  public setLowerBound(lowerBound: TBound): void {
    if(lowerBound >= this.upperBound) {
      console.error(
        'The lower bounds must be lower than the upper bound. ' +
        'This should never be reachable, as the frontend should not allow this.'
      )
    }
    this.lowerBound = lowerBound;
  }

  public getUpperBound(): TBound {
    return this.upperBound;
  }

  public setUpperBound(upperBound: TBound): void {
    if(upperBound <= this.lowerBound) {
      console.error(
        'The upper bounds must be greater than the lower bound. ' +
        'This should never be reachable, as the frontend should not allow this.'
      )
    }
    this.upperBound = upperBound;
  }

  public isSymmetric(): boolean {
    if(this.lowerBound === 0 || this.upperBound === 0) {return false}
    return ((this.upperBound / this.lowerBound) + 1) < this.isSymmetricThreshold
  }
}

export class SensorType {
  public physicalDimension: TPhysicalDimension;
  public physicalUnit: TPhysicalUnit;
  public repr: string

  constructor(
    physicalDimension: TPhysicalDimension,
    physicalUnit: TPhysicalUnit
  ) {
    this.physicalDimension = physicalDimension;
    this.physicalUnit = physicalUnit;
    this.repr = `${physicalDimension} [${physicalUnit}]`
  }

  public toJSON() {
    return {
      physicalDimension: this.physicalDimension,
      physicalUnit: this.physicalUnit,
      classtype: 'SensorType'
    }
  }
}