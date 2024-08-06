import {
  get,
  put
} from './api.ts';
// eslint-disable-next-line max-len
import {
  STHDeviceResponseModel,
  STUDeviceResponseModel
} from '@/client';

export async function delay(): Promise<any> {
  return new Promise((resolve, reject) => {
    get<any>('delay').then(resolve).catch(reject)
  })
}

export async function ping(): Promise<any> {
  return new Promise((resolve, reject) => {
    get<any>('ping').then(resolve).catch(reject)
  })
}

export async function getSTHDevicesMeta(): Promise<STHDeviceResponseModel[]> {
  return new Promise((resolve, reject) => {
    get<(STHDeviceResponseModel)[]>('devices/sth')
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function getSTUDevices(): Promise<STUDeviceResponseModel[]> {
  return new Promise((resolve, reject) => {
    get<STUDeviceResponseModel[]>('devices/stu')
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