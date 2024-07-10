export type TPhysicalDimension = string;
export type TPhysicalUnit = string;
export type TBound = number;

export class Sensor {
  private physicalDimension: TPhysicalDimension;
  private readonly sensorRange: SensorRange;

  constructor(
    physicalDimension: TPhysicalDimension,
    physicalUnit: TPhysicalUnit,
    lowerBound: TBound,
    upperBound: TBound,
  ) {
    this.physicalDimension = physicalDimension;
    this.sensorRange = new SensorRange(physicalUnit, lowerBound, upperBound);
  }

  public getSensorRange(): SensorRange { return this.sensorRange; }

  public getPhysicalDimension(): TPhysicalDimension {
    return this.physicalDimension;
  }

  public setPhysicalDimension(physicalDimension: TPhysicalDimension): void {
    this.physicalDimension = physicalDimension;
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
    return this.isSymmetric() ?
      `+-${this.upperBound}${this.physicalUnit}` :
      `${this.lowerBound}/${this.upperBound}${this.physicalUnit}`
  }
}
