export type TPhysicalDimension = string;
export type TPhysicalUnit = string;
export type TBound = number;

export class Sensor {
  private physicalDimension: TPhysicalDimension;
  private readonly sensorRange: SensorRange;
  public expose: boolean
  private channel: number
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
    this.physicalDimension = physicalDimension;
    this.sensorRange = new SensorRange(physicalUnit, lowerBound, upperBound);
    this.expose = expose;
    this.channel = channel;
    this.name = name;
  }

  public getSensorRange(): SensorRange { return this.sensorRange; }

  public getPhysicalDimension(): TPhysicalDimension {
    return this.physicalDimension;
  }

  public setPhysicalDimension(physicalDimension: TPhysicalDimension): void {
    this.physicalDimension = physicalDimension;
  }

  public getExpose(): boolean {
    return this.expose;
  }

  public setExpose(expose: boolean): void {
    this.expose = expose;
  }

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
}

export class SensorRange {
  private physicalUnit: TPhysicalUnit;
  private lowerBound: TBound;
  private upperBound: TBound;
  private readonly isSymmetricThreshold: number;

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

  public text(): string {
    if(this.physicalUnit === '-') return '-'
    return this.isSymmetric() ?
      `+-${this.upperBound}${this.physicalUnit}` :
      `${this.lowerBound}-${this.upperBound}${this.physicalUnit}`
  }
}
