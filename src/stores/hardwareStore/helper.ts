import {
  BackendSTHActions,
  STHDevice,
  TSTHDeviceMetaData
} from './classes/STHDevice.ts';


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
  newList: Array<TSTHDeviceMetaData>
): Array<STHDevice> {
  const assembledList: Array<STHDevice> = [];
  list.forEach(item => {
    const matching = newList
      .find(newItem => newItem.mac_address === item.Meta().mac_address)
    if (matching) {
      item.Meta().device_number = matching.device_number
      item.Meta().name = matching.name
      item.Meta().rssi = matching.rssi

      assembledList.push(item)

      const index = newList.indexOf(matching)
      newList.splice(index, 1)
    }
  })
  if(newList.length > 0) {
    newList.forEach(item => {
      assembledList.push(new STHDevice(item, new BackendSTHActions()))
    })
  }
  return assembledList
}