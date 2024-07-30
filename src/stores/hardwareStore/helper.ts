import { STHDevice } from './classes/STHDevice.ts';
import { STHDeviceResponseModel } from '@/client';

/*
 * This function consumes new metadata, creates a new list of STHDevices, and
 * updates existing devices with the new metadata. It iterates over the initial
 * list of STHDevices and the new incoming list of metadata.
 * @param {Array<STHDevice>} list - The initial list of STHDevice instances.
 * @param {Array<TSTHDeviceMetaData>} newList - The list of new metadata to be
 *   consumed.
 * @return {Array<STHDevice>} The final list of STHDevice instances, updated
 *   and potentially expanded based on the new metadata.
 */
export function consumeNewMetadata(
  list: Array<STHDevice>,
  newList: Array<STHDeviceResponseModel>
): Array<STHDevice> {
  const assembledList: Array<STHDevice> = [];
  list.forEach(item => {
    const matching = newList
      .find(newItem => newItem.mac_address === item.getMacAddress())
    if (matching) {
      item.setMetadata(matching)
      assembledList.push(item)
      const index = newList.indexOf(matching)
      newList.splice(index, 1)
    }
  })
  if(newList.length > 0) {
    newList.forEach(item => {
      assembledList.push(new STHDevice(
        item.device_number,
        item.name,
        item.mac_address,
        item.rssi
      ))
    })
  }
  return assembledList
}