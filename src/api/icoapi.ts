/* eslint-disable max-len */
import {
  ADCValues,
  FileListResponseModel,
  STHDeviceResponseModel,
  STHRenameRequestModel,
  STHRenameResponseModel,
  STUDeviceResponseModel,
  ControlResponse,
  MeasurementInstructions_Input,
  MeasurementStatus,
  SystemStateModel,
  TridentBucketObject, LogListResponse, LogResponse, Metadata
} from '@/client';
import { useAPI } from './api.ts';

export function getAPILink(): string {
  const protocol = import.meta.env.VITE_API_PROTOCOL;
  const hostname = import.meta.env.VITE_API_HOSTNAME;
  const port = import.meta.env.VITE_API_PORT;
  const version = import.meta.env.VITE_API_VERSION;

  return `${protocol}://${hostname}:${port}/api/${version}`
}

export function getWSLink(): string {
  const protocol = import.meta.env.VITE_API_WS_PROTOCOL;
  const hostname = import.meta.env.VITE_API_HOSTNAME;
  const port = import.meta.env.VITE_API_PORT;
  const version = import.meta.env.VITE_API_VERSION;

  return `${protocol}://${hostname}:${port}/api/${version}`
}

const {
  del,
  get,
  post,
  put
} = useAPI(getAPILink())

export async function delay(): Promise<any> {
  return new Promise((resolve, reject) => {
    get<any>('delay').then(resolve).catch(reject)
  })
}

export async function getSystemState(): Promise<SystemStateModel> {
  return new Promise((resolve, reject) => {
    get<SystemStateModel>('state').then(resolve).catch(reject)
  })
}

export async function getSTHDevicesMeta(): Promise<STHDeviceResponseModel[]> {
  return new Promise((resolve, reject) => {
    get<(STHDeviceResponseModel)[]>('sth')
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function connectSTHDevice(mac_address: string): Promise<void> {
  return new Promise((resolve, reject) => {
    put<{ mac: string }, void>('sth/connect', {mac: mac_address})
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function disconnectSTHDevice(): Promise<void> {
  return new Promise((resolve, reject) => {
    put<any, void>('sth/disconnect', {})
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function renameSTHDevice(model: STHRenameRequestModel): Promise<STHRenameResponseModel> {
  return new Promise((resolve, reject) => {
    put<STHRenameRequestModel, STHRenameResponseModel>('sth/rename', model)
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function getSTUDevices(): Promise<STUDeviceResponseModel[]> {
  return new Promise((resolve, reject) => {
    get<STUDeviceResponseModel[]>('stu')
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function requestSTUConnectionStatus(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    get<boolean>('stu/connected')
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function getADCValues(): Promise<ADCValues> {
  return new Promise((resolve, reject) => {
    get<ADCValues>('sth/read-adc')
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function writeADCValues(mac: string, values: ADCValues): Promise<void> {
  return new Promise((resolve, reject) => {
    put<{ mac: string, config: ADCValues}, void>
      ('sth/write-adc', { mac: mac, config: values })
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function resetSTUDevice(): Promise<void> {
  return new Promise((resolve, reject) => {
    put<any, void>('stu/reset', {})
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function enableSTUOTA(): Promise<void> {
  return new Promise((resolve, reject) => {
    put<any, void>('stu/ota/enable', {})
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function disableSTUOTA(): Promise<void> {
  return new Promise((resolve, reject) => {
    put<any, void>('stu/ota/disable', {})
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function resetCAN(): Promise<void> {
  return new Promise((resolve, reject) => {
    put<void, void>('reset-can', undefined)
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function getMeasurementFiles(): Promise<FileListResponseModel> {
  return new Promise((resolve, reject) => {
    get<FileListResponseModel>('files')
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function deleteMeasurementFile(name: string): Promise<string> {
  return new Promise((resolve, reject) => {
    del<void, string>(`files/${name}`, undefined)
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function getMeasurementStatus(): Promise<MeasurementStatus> {
  return new Promise((resolve, reject) => {
    get<MeasurementStatus>('measurement')
        .then(data => resolve(data))
        .catch(reject)
  })
}

export async function startMeasurement(instructions: MeasurementInstructions_Input): Promise<ControlResponse> {
  return new Promise((resolve, reject) => {
    post<MeasurementInstructions_Input, ControlResponse>('measurement/start', instructions)
        .then(data => resolve(data))
        .catch(reject)
  })
}

export async function stopMeasurement(): Promise<ControlResponse> {
  return new Promise((resolve, reject) => {
    post<undefined, ControlResponse>('measurement/stop', undefined)
        .then(data => resolve(data))
        .catch(reject)
  })
}

export async function uploadFile(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    post<{filename: string}, undefined>('cloud/upload', {filename: name})
        .then(resolve)
        .catch(reject)
  })
}

export async function refreshTridentAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    post<undefined, undefined>('cloud/authenticate', undefined)
        .then(resolve)
        .catch(reject)
  })
}

export async function getCloudFiles(): Promise<Array<TridentBucketObject>> {
  return new Promise((resolve, reject) => {
    get<Array<TridentBucketObject>>('cloud')
        .then(data => resolve(data))
        .catch(reject)
  })
}

export async function getLogs(): Promise<LogListResponse> {
  return new Promise((resolve, reject) => {
    get<LogListResponse>('logs')
        .then(data => resolve(data))
        .catch(reject)
  })
}

export async function getLog(name: string, limit: number = 0): Promise<LogResponse> {
  return new Promise((resolve, reject) => {
    get<LogResponse>(`logs/view?file=${name}&limit=${limit}`)
        .then(data => resolve(data))
        .catch(reject)
  })
}

export async function sendMeasurementStopFlag(): Promise<void> {
  return new Promise((resolve, reject) => {
    post<undefined, undefined>('measurement/stop', undefined)
        .then(resolve)
        .catch(reject)
  })
}

export async function sendMeasurementPostMeta(meta: Metadata): Promise<void> {
  return new Promise((resolve, reject) => {
    post<Metadata, undefined>('measurement/post_meta', meta)
        .then(resolve)
        .catch(reject)
  })
}