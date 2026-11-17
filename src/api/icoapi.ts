/* eslint-disable max-len */
import {
  ADCValues,
  CANNetwork,
  CANNetworksModel,
  FileListResponseModel,
  STHDeviceResponseModel,
  STHRenameRequestModel,
  STHRenameResponseModel,
  STUDeviceResponseModel,
  ControlResponse,
  MeasurementInstructions_Input,
  MeasurementStatus,
  SystemStateModel,
  RemoteObjectDetails,
  LogListResponse,
  LogResponse,
  Metadata,
  AvailableSensorInformation,
  ConfigResponse,
  ConfigRestoreRequest,
  FileCloudDetails,
  DeleteEmbeddedFileApiV1FilesNameEmbeddedDatasetNameDeleteData,
  Body_update_file_api_v1_cloud_update_post,
  SupplyVoltageResponseModel,
  PreflightResponse,
  UnitStateModel
} from '@/client';
import { useAPI } from './api.ts';
import { buildApiLink, buildWsLink } from './apiEndpoint.ts';
import ToastEventBus from 'primevue/toasteventbus';

// The address is an override of the user (localStorage) or the default of
// the environment, see `apiEndpoint.ts`. It only changes with a page reload.
export function getAPILink(): string {
  return buildApiLink();
}

export function getWSLink(): string {
  return buildWsLink();
}

const {
  del,
  get,
  post,
  put
} = useAPI(getAPILink(), (error) => {
  ToastEventBus.emit('add', {
    severity: 'error',
    summary: 'Error',
    detail: error,
    life: 5000,
    group: 'default'
  })
})

export async function delay(): Promise<any> {
  return new Promise((resolve, reject) => {
    get<any>('delay').then(resolve).catch(reject)
  })
}

// The state is requested in the background, so failed requests must not show
// an error message (e.g. when the API is not reachable yet).
const { get: getQuiet } = useAPI(getAPILink())

/**
 * Add the unit to the endpoint (multi STU support).
 *
 * Without a unit the API uses the first one.
 */
export function forUnit(endpoint: string, unit?: string | null): string {
  if(!unit) return endpoint
  const separator = endpoint.includes('?') ? '&' : '?'
  return `${endpoint}${separator}unit=${encodeURIComponent(unit)}`
}

export async function getSystemState(): Promise<SystemStateModel> {
  return new Promise((resolve, reject) => {
    getQuiet<SystemStateModel>('state').then(resolve).catch(reject)
  })
}

// Used for the periodic search: failed requests must not show an error.
export async function getCANNetworksQuiet(): Promise<CANNetworksModel> {
  return new Promise((resolve, reject) => {
    getQuiet<CANNetworksModel>('can/networks').then(resolve).catch(reject)
  })
}

export async function getCANNetworks(): Promise<CANNetworksModel> {
  return new Promise((resolve, reject) => {
    get<CANNetworksModel>('can/networks').then(resolve).catch(reject)
  })
}

export async function connectCAN(network?: Pick<CANNetwork, 'interface' | 'channel'>): Promise<CANNetworksModel> {
  return new Promise((resolve, reject) => {
    put<Pick<CANNetwork, 'interface' | 'channel'> | undefined, CANNetworksModel>('can/connect', network)
      .then(resolve)
      .catch(reject)
  })
}

export async function getUnits(): Promise<UnitStateModel[]> {
  return new Promise((resolve, reject) => {
    get<UnitStateModel[]>('can/units').then(resolve).catch(reject)
  })
}

export async function disconnectCAN(unit?: string): Promise<CANNetworksModel> {
  return new Promise((resolve, reject) => {
    put<void, CANNetworksModel>(forUnit('can/disconnect', unit), undefined)
      .then(resolve)
      .catch(reject)
  })
}

export async function getSTHDevicesMeta(unit?: string | null): Promise<STHDeviceResponseModel[]> {
  return new Promise((resolve, reject) => {
    get<(STHDeviceResponseModel)[]>(forUnit('sth', unit))
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function connectSTHDevice(mac_address: string, unit?: string | null): Promise<void> {
  return new Promise((resolve, reject) => {
    put<{ mac_address: string }, void>(forUnit('sth/connect', unit), { mac_address: mac_address })
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function disconnectSTHDevice(unit?: string | null): Promise<void> {
  return new Promise((resolve, reject) => {
    put<any, void>(forUnit('sth/disconnect', unit), {})
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function renameSTHDevice(model: STHRenameRequestModel, unit?: string | null): Promise<STHRenameResponseModel> {
  return new Promise((resolve, reject) => {
    put<STHRenameRequestModel, STHRenameResponseModel>(forUnit('sth/rename', unit), model)
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function getSTUDevices(unit?: string | null): Promise<STUDeviceResponseModel[]> {
  return new Promise((resolve, reject) => {
    get<STUDeviceResponseModel[]>(forUnit('stu', unit))
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function requestSTUConnectionStatus(unit?: string | null): Promise<boolean> {
  return new Promise((resolve, reject) => {
    get<boolean>(forUnit('stu/connected', unit))
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function getADCValues(unit?: string | null): Promise<ADCValues> {
  return new Promise((resolve, reject) => {
    get<ADCValues>(forUnit('sth/read-adc', unit))
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function writeADCValues(values: ADCValues, unit?: string | null): Promise<void> {
  return new Promise((resolve, reject) => {
    put<{ config: ADCValues }, void>
      (forUnit('sth/write-adc', unit), { config: values })
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function getSupplyVoltage(unit?: string | null): Promise<SupplyVoltageResponseModel> {
  return new Promise((resolve, reject) => {
    get<SupplyVoltageResponseModel>(forUnit('sth/supply-voltage', unit))
        .then(data => resolve(data))
        .catch(reject)
  })
}

export async function resetSTUDevice(unit?: string | null): Promise<void> {
  return new Promise((resolve, reject) => {
    put<any, void>(forUnit('stu/reset', unit), {})
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function enableSTUOTA(unit?: string | null): Promise<void> {
  return new Promise((resolve, reject) => {
    put<any, void>(forUnit('stu/ota/enable', unit), {})
      .then(data => resolve(data))
      .catch(reject)
  })
}

export async function disableSTUOTA(unit?: string | null): Promise<void> {
  return new Promise((resolve, reject) => {
    put<any, void>(forUnit('stu/ota/disable', unit), {})
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

/**
 * Check if all units are ready for a measurement (nothing is changed)
 */
export async function getPreflight(): Promise<PreflightResponse> {
  return new Promise((resolve, reject) => {
    get<PreflightResponse>('measurement/preflight')
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

export async function getCloudFiles(): Promise<Array<RemoteObjectDetails>> {
  return new Promise((resolve, reject) => {
    get<Array<RemoteObjectDetails>>('cloud')
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

export async function sendPreMetaOverride(name: string, meta: Metadata): Promise<void> {
  return new Promise((resolve, reject) => {
    post<Metadata, undefined>(`files/pre_meta/${name}`, meta)
        .then(resolve)
        .catch(reject)
  })
}

export async function sendPostMetaOverride(name: string, meta: Metadata): Promise<void> {
  return new Promise((resolve, reject) => {
    post<Metadata, undefined>(`files/post_meta/${name}`, meta)
        .then(resolve)
        .catch(reject)
  })
}

export async function deletePreMeta(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    del<void, undefined>(`files/pre_meta/${name}`, undefined)
        .then(resolve)
        .catch(reject)
  })
}

export async function deletePostMeta(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    del<void, undefined>(`files/post_meta/${name}`, undefined)
        .then(resolve)
        .catch(reject)
  })
}

export async function getMetadata(name: string): Promise<Metadata> {
  return new Promise((resolve, reject) => {
    get<Metadata>(`files/meta/${name}`)
        .then(data => resolve(data))
        .catch(reject)
  })
}

export async function getSensorInformation(): Promise<AvailableSensorInformation> {
  return new Promise((resolve, reject) => {
    get<AvailableSensorInformation>('sensor')
        .then(data => resolve(data))
        .catch(reject)
  })
}

export async function getConfigBackup(): Promise<ConfigResponse> {
  return new Promise((resolve, reject) => {
    get<ConfigResponse>('config/backup')
        .then(data => resolve(data))
        .catch(reject)
  })
}

export async function restoreConfigBackup(config: ConfigRestoreRequest): Promise<void> {
  return new Promise((resolve, reject) => {
    put<ConfigRestoreRequest, void>('config/restore', config)
        .then(data => resolve(data))
        .catch(reject)
  })
}

export async function deleteFileFromHDF5(filename: string, embedded_file_name: string): Promise<DeleteEmbeddedFileApiV1FilesNameEmbeddedDatasetNameDeleteData> {
  return new Promise((resolve, reject) => {
    del<void, DeleteEmbeddedFileApiV1FilesNameEmbeddedDatasetNameDeleteData>(
        `files/${encodeURIComponent(filename)}/embedded/${encodeURIComponent(embedded_file_name)}`, undefined
    ).then(data => resolve(data)).catch(reject)
  })
}

export async function updateFile(name: string, id: number|null): Promise<FileCloudDetails> {
  return new Promise((resolve, reject) => {
    const body: Body_update_file_api_v1_cloud_update_post = {
      filename: name, file_id: id
    }
    post<Body_update_file_api_v1_cloud_update_post, FileCloudDetails>('cloud/update', body)
        .then(resolve)
        .catch(reject)
  })
}