import { Sensor } from '@/stores/hardwareStore/classes/Sensor.ts';

export class HolderConfig {
  public name: string
  public id: string
  public sensors: Array<{
    channel: number,
    sensor: Sensor
  }>

  constructor(
    name: string,
    id: string,
    sensors: Array<{
      channel: number,
      sensor: Sensor
    }> = []
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