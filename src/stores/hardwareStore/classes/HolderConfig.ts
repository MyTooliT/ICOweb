import { Sensor } from '@/stores/hardwareStore/classes/Sensor.ts';

export type TAssignedSensor = {
  channel: number,
  sensor: Sensor
}

export class HolderConfig {
  public name: string
  public id: string
  public sensors: Array<TAssignedSensor>

  constructor(
    name: string,
    id: string,
    sensors: Array<TAssignedSensor> = []
  ) {
    this.name = name
    this.id = id
    this.sensors = sensors
  }

  public toJSON() {
    return {
      name: this.name,
      id: this.id,
      sensors: this.sensors,
      classtype: 'Holder'
    }
  }
}