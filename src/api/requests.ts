import { get } from './api.ts';
// eslint-disable-next-line max-len
import { TSTHDeviceMetaData } from '@/stores/hardwareStore/classes/STHDevice.ts';

export async function delay(): Promise<any> {
  return new Promise((resolve, reject) => {
    get<any>('delay').then(resolve).catch(reject)
  })
}

export async function getSTHDevicesMeta(): Promise<TSTHDeviceMetaData[]> {
  return new Promise((resolve, reject) => {
    get<(TSTHDeviceMetaData& {regex_str?: string})[]>('devices/sth')
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function getSTUHealth(nr: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    get<boolean>(`devices/stu/alive/${nr}`)
      .then(alive => resolve(alive))
      .catch(reject)
  })
}

export async function getSTUMAC(nr: number): Promise<string> {
  return new Promise((resolve, reject) => {
    get<string>(`devices/stu/mac/${nr}`)
      .then(alive => resolve(alive))
      .catch(reject)
  })
}