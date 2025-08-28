import {
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
import { consumeNewMetadata } from './helper.ts';
import {PCBSensorConfiguration, Sensor as RawSensor} from '@/client/types.gen.ts'

export const useHardwareStore = defineStore('hardware', () => {
  const sensorList = ref<Array<Sensor>>([]);

  function clearSensorList() {
    sensorList.value.length = 0
  }

  function parseSensorFromRaw(raw: RawSensor): Sensor {
    return new Sensor(
        raw.sensor_id,
        raw.dimension,
        raw.unit,
        raw.phys_min,
        raw.phys_max,
        true,
        raw.name
    )
  }

  function parseSensorList(sensors: Array<RawSensor>) {
    sensors.forEach(sensor => {
      sensorList.value.push(parseSensorFromRaw(sensor))
    })
    console.log(sensorList.value)
  }

  /*
  ******************************************************
  *                     STH State                      *
  ******************************************************
  */

  const STHDeviceList = ref<STHDevice[]>([])
  const STHDevicesLoading: Ref<boolean> = ref(false)
  async function updateSTHDeviceList(defaultHolder: string = 'default-sth'): Promise<void> {
    STHDevicesLoading.value = true
    const meta = await getSTHDevicesMeta()
    // Note: Why do we have to typecast the STHDevice array here?
    STHDeviceList.value = consumeNewMetadata(STHDeviceList.value as STHDevice[], meta, defaultHolder)
    STHDevicesLoading.value = false
  }
  function clearSTHDeviceList(): void {
    STHDeviceList.value = []
  }
  const activeSTH = computed(() => {
    return STHDeviceList.value.filter(entry => entry.isConnected())[0]
  })
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
    // TODO: Implement more STU support
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
    console.log(holderList.value)
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
    parseHolderList
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
