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

// eslint-disable-next-line max-len
export async function getSTHDevicesMeta(): Promise<STHDeviceResponseModel[]> {
  return new Promise((resolve, reject) => {
    get<(STHDeviceResponseModel)[]>('sth')
      .then(data => resolve(data))
      .catch(reject)
  })
}

// eslint-disable-next-line max-len
export async function getSTUDevices(): Promise<STUDeviceResponseModel[]> {
  return new Promise((resolve, reject) => {
    get<STUDeviceResponseModel[]>('stu')
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function resetSTUDevice(deviceName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    put<any, void>('stu/reset', { name : deviceName })
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function enableSTUOTA(deviceName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    put<any, void>('stu/ota/enable', { name : deviceName })
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function disableSTUOTA(deviceName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    put<{ name: string }, void>('stu/ota/disable', { name: deviceName })
      .then(data => resolve(data))
      .catch(reject)
  })
}