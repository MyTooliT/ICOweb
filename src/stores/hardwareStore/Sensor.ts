export type physicalDimension = string;
export type physicalUnit = string;
export type lowerBound = number;
export type upperBound = number;

export class Sensor {
  private physicalDimension: physicalDimension;
  private readonly sensorRange: SensorRange;

  constructor(
    physicalDimension: physicalDimension,
    physicalUnit: physicalUnit,
    lowerBound: lowerBound,
    upperBound: upperBound,
  ) {
    this.physicalDimension = physicalDimension;
    this.sensorRange = new SensorRange(physicalUnit, lowerBound, upperBound);
  }

  public getSensorRange(): SensorRange { return this.sensorRange; }

  public getPhysicalDimension(): physicalDimension {
    return this.physicalDimension;
  }

  public setPhysicalDimension(physicalDimension: physicalDimension): void {
    this.physicalDimension = physicalDimension;
  }
}

export class SensorRange {
  private physicalUnit: physicalUnit;
  private lowerBound: lowerBound;
  private upperBound: upperBound;
  private readonly isSymmetricThreshold: number;

  constructor(
    physicalUnit: physicalUnit,
    lowerBound: lowerBound,
    upperBound: upperBound,
    isSymmetricThreshold: number = 0.001
  ) {
    this.physicalUnit = physicalUnit;
    this.lowerBound = lowerBound;
    this.upperBound = upperBound;
    this.isSymmetricThreshold = isSymmetricThreshold;
  }

  public getPhysicalUnit(): physicalUnit {
    return this.physicalUnit;
  }

  public setPhysicalUnit(physicalUnit: physicalUnit): void {
    this.physicalUnit = physicalUnit;
  }

  public getLowerBound(): lowerBound {
    return this.lowerBound;
  }

  public setLowerBound(lowerBound: lowerBound): void {
    if(lowerBound >= this.upperBound) {
      console.error(
        'The lower bounds must be lower than the upper bound. ' +
        'This should never be reachable, as the frontend should not allow this.'
      )
    }
    this.lowerBound = lowerBound;
  }

  public getUpperBound(): upperBound {
    return this.upperBound;
  }

  public setUpperBound(upperBound: upperBound): void {
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
