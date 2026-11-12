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
  Sensor as RawSensor
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
  async function updateSTHDeviceList(defaultHolder: string | undefined = undefined): Promise<void> {
    STHDevicesLoading.value = true
    const meta = await getSTHDevicesMeta()
    // Note: Why do we have to typecast the STHDevice array here?
    STHDeviceList.value = consumeNewMetadata(
        STHDeviceList.value as STHDevice[],
        meta,
        defaultHolder ?? defaultHolderID.value,
        holderList.value
    )
    STHDevicesLoading.value = false
  }
  function clearSTHDeviceList(): void {
    STHDeviceList.value = []
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
  function applyConnectedSTH(connected: ConnectedSTHModel | null | undefined) {
    if(!connected) {
      STHDeviceList.value.forEach(
        device => device.setConnectionStatus('disconnected'))
      return
    }

    const normalize = (mac: string) => mac.toLowerCase().replace(/[^0-9a-f]/g, '')
    let match = STHDeviceList.value.find(
      device => normalize(device.getMacAddress()) === normalize(connected.mac_address)
    )
    if(!match) {
      // The device reports its MAC itself, which may differ from the one the
      // STU listed. Fall back to the name, if that is unambiguous.
      const sameName = STHDeviceList.value.filter(
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
    STHDeviceList.value.forEach(
      device => device.setConnectionStatus(
        device === match ? 'connected' : 'disconnected'))
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
  async function updateSTUDeviceList(): Promise<void> {
    STUDeviceLoading.value = true
    try {
      const meta = await getSTUDevices()
      STUDeviceList.value = meta.map(entry => {
        return new STUDevice(
          entry.device_number,
          entry.name,
          entry.mac_address
        )
      })
    } catch(e) {
      STUDeviceList.value = []
    }
    STUDeviceLoading.value = false
  }
  const activeSTU = computed<STUDevice>(() => {
    return STUDeviceList.value[0]
  })
  const hasSTU = computed<boolean>(() => {
    return STUDeviceList.value.length > 0
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
    deselectSTHDevices,
    applyConnectedSTH,
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
