import { StateTree } from 'pinia';
import { STUDevice } from '@/stores/hardwareStore/classes/STUDevice.ts';
import { STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';

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
  if(item['classtype'] === 'STU') {
    return new STUDevice(
      item.device_number,
      item.name,
      item.mac_address,
      item.connection_status,
      item.OTAState,
    )
  } else if(item['classtype'] === 'STH') {
    return new STHDevice(
      item.device_number,
      item.name,
      item.mac_address,
      item.rssi,
      item.connection_status,
      item.regex
    )
  } else {
    return item
  }
}