import { HolderConfig } from '@/stores/hardwareStore/classes/HolderConfig.ts';
import {
  Sensor,
  SensorRange,
  SensorType
} from '@/stores/hardwareStore/classes/Sensor.ts';
import { STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';
import { STUDevice } from '@/stores/hardwareStore/classes/STUDevice.ts';
import { StateTree } from 'pinia';

export function deserializeWithClassParsing(value: string): StateTree {
  const deserialized = JSON.parse(value)
  Object.entries(deserialized).forEach(([key, val]) => {
    if(val instanceof Array) {
      deserialized[key] = val.map(parseItem)
    } else if(val instanceof Object) {
      deserialized[key] = parseItem(val);
    } else {
      deserialized[key] = val
    }
  })
  return deserialized
}


function parseItem(item: any): any {
  if(item instanceof Object && !Array.isArray(item)) {
    switch(item['classtype']) {
      case 'STU':
        return new STUDevice(
          item.device_number,
          item.name,
          item.mac_address,
          item.status,
          item.OTAState,
        )

      case 'STH':
        return new STHDevice(
          item.device_number,
          item.name,
          item.mac_address,
          item.rssi,
          item.holderConfigId,
          item.status
        )

      case 'Sensor':
        return new Sensor(
          item.sensor_id,
          item.physicalDimension,
          item.physicalUnit,
          item.lowerBound,
          item.upperBound,
          item.expose,
          item.name
        )

      case 'SensorType':
        return new SensorType(
          item.physicalDimension,
          item.physicalUnit
        )

      case 'SensorRange':
        return new SensorRange(
          item.physicalUnit,
          item.lowerBound,
          item.upperBound,
          item.isSymmetricThreshold,
        )

      case 'Holder':
        return new HolderConfig(
          item.name,
          item.id,
          item.sensors.map((entry: any) => {
            return {
              channel: entry.channel,
              sensor: new Sensor(
                entry.sensor.sensor_id,
                entry.sensor.physicalDimension,
                entry.sensor.physicalUnit,
                entry.sensor.lowerBound,
                entry.sensor.upperBound,
                entry.sensor.expose,
                entry.sensor.name
              )
            }
          })
        )
    }
  } else {
    return item
  }

}