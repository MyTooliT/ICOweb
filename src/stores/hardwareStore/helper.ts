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


/**
 * Function that calculates the sum of an array of numbers.
 * @param {number[]} arr - The array of numbers.
 * @return {number} The sum of all numbers in the array.
 */
export function sum(arr: number[]): number {
  let acc = 0
  arr.forEach((item) => {acc += item})
  return acc
}


/**
 * Function that calculates the floating average of an array of numbers over a
 * specified window.
 * @param {number[]} arr - The array of numbers.
 * @param {number} window - The length of the window over which to calculate
 *   the average.
 * @return {number[]} An array of the calculated averages for each window of
 *   numbers.
 */
export function floatingAverage(arr: number[], window: number = 50): number[] {
  const avg = []
  for(let i = 0; i < arr.length - window; i++) {
    avg.push(sum(arr.slice(i, i + window)) / window);
  }
  return avg
}