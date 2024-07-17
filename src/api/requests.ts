import { get } from './api.ts';
// eslint-disable-next-line max-len
import { TSTHDeviceMetaData } from '@/stores/hardwareStore/classes/STHDevice.ts';

// TODO: type this.
export async function delay(): Promise<any> {
  return new Promise((resolve, reject) => {
    get<any>('delay').then(resolve).catch(reject)
  })
}

export async function getSTHDevicesMeta(): Promise<TSTHDeviceMetaData[]> {
  return new Promise((resolve, reject) => {
    get<(TSTHDeviceMetaData& {regex_str?: string})[]>('devices')
      .then((data) => {
        data.forEach(entry => {
          if(entry.regex_str) {
            entry.regex = new RegExp(entry.regex_str)
            delete entry.regex_str
          }
        })
      resolve(data)
    }).catch(reject)
  })
}