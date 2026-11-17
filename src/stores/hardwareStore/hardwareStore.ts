import {
  getSensorInformation,
  getSTHDevicesMeta,
  getSTUDevices
} from '@/api/icoapi.ts';
import {HolderConfig, TAssignedSensor} from '@/stores/hardwareStore/classes/HolderConfig.ts';
import { STUDevice } from '@/stores/hardwareStore/classes/STUDevice.ts';
import { deserializeWithClassParsing } from '@/stores/hardwareStore/localStoreParser.ts';
import { defineStore } from 'pinia';
import {
  computed,
  Ref,
  ref
} from 'vue';
import { Sensor } from './classes/Sensor.ts';
import { STHDevice } from './classes/STHDevice.ts';
import {consumeNewMetadata, parseSensorFromRaw} from './helper.ts';
import {
  ConnectedSTHModel,
  PCBSensorConfiguration,
  Sensor as RawSensor,
  UnitStateModel
} from '@/client/types.gen.ts'

export const useHardwareStore = defineStore('hardware', () => {
  const sensorList = ref<Array<Sensor>>([]);

  function clearSensorList() {
    sensorList.value.length = 0
  }

  function parseSensorList(sensors: Array<RawSensor>) {
    sensors.forEach(sensor => {
      sensorList.value.push(parseSensorFromRaw(sensor))
    })
  }

  /*
  ******************************************************
  *                     STH State                      *
  ******************************************************
  */

  const STHDeviceList = ref<STHDevice[]>([])
  const STHDevicesLoading: Ref<boolean> = ref(false)
  /**
   * Load the sensor devices a unit can see.
   *
   * @param defaultHolder Holder configuration for devices that are new
   * @param unit The unit (multi STU support). Without it the list of all
   *   devices is replaced, like it is without multi STU support.
   */
  async function updateSTHDeviceList(
    defaultHolder: string | undefined = undefined,
    unit: string | null = null
  ): Promise<void> {
    STHDevicesLoading.value = true
    try {
      const meta = await getSTHDevicesMeta(unit)
      // Note: Why do we have to typecast the STHDevice array here?
      const updated = consumeNewMetadata(
          sthListFor(unit) as STHDevice[],
          meta,
          defaultHolder ?? defaultHolderID.value,
          holderList.value,
          unit
      )
      STHDeviceList.value = [...STHDeviceList.value.filter(
        device => !belongsTo(device, unit)), ...updated]
    } finally {
      STHDevicesLoading.value = false
    }
  }
  function clearSTHDeviceList(unit: string | null = null): void {
    STHDeviceList.value = STHDeviceList.value.filter(
      device => !belongsTo(device, unit))
  }
  /** Devices without unit belong to every list (single unit) */
  function belongsTo(device: { unit: string | null }, unit: string | null): boolean {
    return unit === null || device.unit === unit
  }
  /** The sensor devices of a unit (all devices without unit) */
  function sthListFor(unit: string | null): STHDevice[] {
    return STHDeviceList.value.filter(
      device => belongsTo(device, unit)) as STHDevice[]
  }
  /** The connected sensor device of a unit */
  function activeSTHFor(unit: string | null): STHDevice | undefined {
    return sthListFor(unit).find(device => device.isConnected())
  }
  /** Holder configuration of the connected sensor device of a unit */
  function holderFor(unit: string | null): HolderConfig | undefined {
    const id = activeSTHFor(unit)?.holderConfigId
    return id ? getHolder(id) : undefined
  }
  const activeSTH = computed(() => {
    return STHDeviceList.value.filter(entry => entry.isConnected())[0]
  })
  /**
   * Make the STH list match the sensor device the API is connected to.
   *
   * The API is the source of truth: the list is restored from local storage on
   * reload, but the connection lives in the API. The list is never extended
   * here, only the connection status of listed devices is updated.
   */
  function applyConnectedSTH(
    connected: ConnectedSTHModel | null | undefined,
    unit: string | null = null
  ) {
    const devices = sthListFor(unit)
    if(!connected) {
      devices.forEach(
        device => device.setConnectionStatus('disconnected'))
      return
    }

    const normalize = (mac: string) => mac.toLowerCase().replace(/[^0-9a-f]/g, '')
    let match = devices.find(
      device => normalize(device.getMacAddress()) === normalize(connected.mac_address)
    )
    if(!match) {
      // The device reports its MAC itself, which may differ from the one the
      // STU listed. Fall back to the name, if that is unambiguous.
      const sameName = devices.filter(
        device => device.getName() === connected.name)
      if(sameName.length === 1) {
        match = sameName[0]
        console.warn(
          `[STH] Matched ${connected.name} by name: API reports MAC ` +
          `${connected.mac_address}, list has ${match.getMacAddress()}`)
      }
    }
    if(!match) {
      // Do not guess, and do not invent a device either
      console.warn(`[STH] Connected device not in list: ${connected.name} ` +
        `(${connected.mac_address})`)
      return
    }
    devices.forEach(
      device => device.setConnectionStatus(
        device === match ? 'connected' : 'disconnected'))
  }
  /**
   * Make the sensor devices match the units of the API (multi STU support).
   *
   * Every unit has its own connected sensor device. Devices of units that do
   * not exist any more are marked as disconnected.
   */
  function applyConnectedSTHs(units: UnitStateModel[]) {
    const names = new Set(units.map(unit => unit.unit))
    STHDeviceList.value
      .filter(device => device.unit !== null && !names.has(device.unit))
      .forEach(device => device.setConnectionStatus('disconnected'))
    units.forEach(unit => applyConnectedSTH(unit.sth_connected, unit.unit))
  }
  function deselectSTHDevices() {
    STHDeviceList.value.forEach(
      device => device.setConnectionStatus('disconnected'));
  }

  const hasSTH = computed<boolean>(() => {
    return STHDeviceList.value.length > 0
  })

  /*
  ******************************************************
  *                     STU State                      *
  ******************************************************
  */

  const STUDeviceList: Ref<Array<STUDevice>> = ref([])
  const STUDeviceLoading: Ref<boolean> = ref(false)
  /** The STUs of a unit (all STUs without unit) */
  function stuListFor(unit: string | null): STUDevice[] {
    return STUDeviceList.value.filter(device => belongsTo(device, unit))
  }
  // Loading that is going on (by unit): A page refresh asks for the same STU
  // from several places at once
  const STULoads = new Map<string | null, Promise<void>>()
  function updateSTUDeviceList(unit: string | null = null): Promise<void> {
    const running = STULoads.get(unit)
    if(running) return running
    const load = loadSTUDevices(unit).finally(() => STULoads.delete(unit))
    STULoads.set(unit, load)
    return load
  }
  async function loadSTUDevices(unit: string | null): Promise<void> {
    STUDeviceLoading.value = true
    let found: STUDevice[] = []
    try {
      const meta = await getSTUDevices(unit)
      found = meta.map(entry => new STUDevice(
        entry.device_number,
        entry.name,
        entry.mac_address,
        'disconnected',
        'disabled',
        unit
      ))
    } catch(e) {
      found = []
    }
    // Other units may have been loaded while waiting: keep what is there now
    STUDeviceList.value = [
      ...STUDeviceList.value.filter(device => !belongsTo(device, unit)),
      ...found
    ]
    STUDeviceLoading.value = false
  }
  function clearSTUDeviceList(unit: string | null = null): void {
    STUDeviceList.value = STUDeviceList.value.filter(
      device => !belongsTo(device, unit))
  }
  /**
   * Load the STU and the sensor devices of a unit.
   *
   * Only needs the sensor information the first time.
   */
  async function loadUnit(unit: string): Promise<void> {
    await updateSTUDeviceList(unit)
    if(holderList.value.length === 0) await refetchSensorsAndHolders()
    await updateSTHDeviceList(defaultHolderID.value, unit)
  }
  /**
   * Remove everything that belongs to units that do not exist (any more).
   */
  function forgetUnitsExcept(units: string[]): void {
    const known = new Set(units)
    const stale = (device: { unit: string | null }) =>
      device.unit !== null && !known.has(device.unit)
    STUDeviceList.value = STUDeviceList.value.filter(device => !stale(device))
    STHDeviceList.value = STHDeviceList.value.filter(device => !stale(device))
  }
  const activeSTU = computed<STUDevice>(() => {
    return STUDeviceList.value[0]
  })
  const hasSTU = computed<boolean>(() => {
    return STUDeviceList.value.length > 0
  })
  /** Every connected sensor device (one per unit with multi STU support) */
  const activeSTHs = computed<STHDevice[]>(() => {
    return STHDeviceList.value.filter(
      entry => entry.isConnected()) as STHDevice[]
  })
  async function checkSTUConnection() {
    if(!activeSTU.value) return false
    await activeSTU.value.checkConnection()
    if(!activeSTU.value.isConnected()) {
      STHDeviceList.value.forEach((device) => {
        device.setConnectionStatus('disconnected')
      })
      return false
    } else {
      return true
    }
  }

  /*
  ******************************************************
  *                  HolderConfig State                *
  ******************************************************
  */

  const holderList = ref<Array<HolderConfig>>([])
  const defaultHolderID = ref<string>('')

  function clearHolderList() {
    holderList.value.length = 0
  }

  function getHolder(id: string): HolderConfig | undefined {
    const holder = holderList.value.find(holder => holder.id === id)
    return holder as HolderConfig ?? undefined
  }

  const activeHolder = computed<HolderConfig | undefined>(() => {
    const id = activeSTH.value?.holderConfigId
    if(!id) return undefined
    return getHolder(id)
  })

  const hasHolder = computed<boolean>(() => {
    return activeHolder.value !== undefined
  })

  function parseHolderList(configs: Array<PCBSensorConfiguration>) {
    configs.forEach(config => {
      const channelList: Array<TAssignedSensor> = []
      Object.entries(config.channels).forEach(configChannel => {
        channelList.push({
          channel: Number(configChannel[0]),
          sensor: parseSensorFromRaw(configChannel[1])
        })
      })

      holderList.value.push(new HolderConfig(
          config.configuration_name,
          config.configuration_id,
          channelList
      ))
    })
  }

  async function refetchSensorsAndHolders() {
    const { sensors, configurations, default_configuration_id } = await getSensorInformation()
    clearSensorList()
    parseSensorList(sensors)
    clearHolderList()
    parseHolderList(configurations)
    if(default_configuration_id !== '') {
      defaultHolderID.value = default_configuration_id
    } else {
      defaultHolderID.value = configurations[0].configuration_id
    }
  }

  return {
    sensorList,
    clearSensorList,
    STHDeviceList,
    updateSTHDeviceList,
    STHDevicesLoading,
    STUDeviceLoading,
    updateSTUDeviceList,
    STUDeviceList,
    activeSTU,
    activeSTH,
    activeSTHs,
    activeSTHFor,
    holderFor,
    sthListFor,
    stuListFor,
    clearSTUDeviceList,
    loadUnit,
    forgetUnitsExcept,
    deselectSTHDevices,
    applyConnectedSTH,
    applyConnectedSTHs,
    holderList,
    getHolder,
    activeHolder,
    hasSTU,
    hasSTH,
    checkSTUConnection,
    clearSTHDeviceList,
    hasHolder,
    parseSensorList,
    clearHolderList,
    parseHolderList,
    refetchSensorsAndHolders,
    defaultHolderID
  }
}, {
  persist: {
    debug: true,
    serializer: {
      serialize: JSON.stringify,
      deserialize: deserializeWithClassParsing
    }
  },
})
