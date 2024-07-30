import {
  get,
  put
} from './api.ts';
// eslint-disable-next-line max-len
import { TSTHDeviceMetaData } from '@/stores/hardwareStore/classes/STHDevice.ts';
import { TDeviceMetaData } from '@/stores/hardwareStore/classes/Device.ts';

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

export async function getSTUDevices(): Promise<TDeviceMetaData[]> {
  return new Promise((resolve, reject) => {
    get<TDeviceMetaData[]>('devices/stu')
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function resetSTUDevice(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    put<{ name: string }, void>('devices/stu/reset', { name })
      .then(data => resolve(data))
      .catch(reject)
  })
}