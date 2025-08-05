import {
  getSTHDevicesMeta,
  getSTUDevices
} from '@/api/icoapi.ts';
import {
  HolderConfig,
  TAssignedSensor
} from '@/stores/hardwareStore/classes/HolderConfig.ts';
import { STUDevice } from '@/stores/hardwareStore/classes/STUDevice.ts';
// eslint-disable-next-line max-len
import { deserializeWithClassParsing } from '@/stores/hardwareStore/localStoreParser.ts';
import { findNextFree } from '@/utils/helper.ts';
import { defineStore } from 'pinia';
import {
  computed,
  Ref,
  ref
} from 'vue';
import {
  Sensor,
  SensorRange,
  SensorType
} from './classes/Sensor.ts';
import { STHDevice } from './classes/STHDevice.ts';
import { consumeNewMetadata } from './helper.ts';

export const useHardwareStore = defineStore('hardware', () => {
  const sensorList = ref<Array<Sensor>>(sensorListPreset);
  function addSensor(newSensor: Sensor) {
    sensorList.value.push(newSensor);
  }
  function clearSensorList() {
    sensorList.value.length = 0
  }
  function removeSensor(sensor: Sensor) {
    const index = sensorList.value.indexOf(sensor);
    if (index > -1) {
      sensorList.value.splice(index, 1);
    }
  }

  const exposedSensors = computed<Array<Sensor>>(() => {
    return sensorList.value.filter(sensor => sensor.expose)
  })

  function canUnexposeSensor(sensor: Sensor): boolean {
    const assignedSensors = new Set(holderList.value
      .filter(holder => holder.id !== 'all-sensors')
      .map(holder => holder.sensors)
      .flat()
      .map(sensor => sensor.sensor.name))

    return assignedSensors.has(sensor.name)
  }

  const sensorDimensionList = ref<Array<SensorType>>([
    new SensorType('Acceleration', 'g'),
    new SensorType('Temperature', '°C'),
    new SensorType('Light', 'cd'),
    new SensorType('Voltage', 'V'),
    new SensorType('Backpack', '-'),
  ])
  function removeDimension(dim: SensorType): void {
    const index = sensorDimensionList.value.indexOf(dim);
    if(index > -1) {
      sensorDimensionList.value.splice(index, 1);
    }
  }
  function addSensorDimension(dim: string, unit: string) {
    sensorDimensionList.value.push(
      new SensorType(dim, unit)
    )
  }
  const sensorRangeList = ref<Array<SensorRange>>([
    new SensorRange('g', -100, 100),
    new SensorRange('g', -40, 40),
    new SensorRange('°C', 0, 1000),
    new SensorRange('cd', 0, 1000),
    new SensorRange('V', 0, 3.7),
    new SensorRange('-', 0, 0)
  ])

  function addSensorRange(unit: string, lower: number, upper: number) {
    sensorRangeList.value.push(
      new SensorRange(unit, lower, upper)
    )
  }

  function sensorRangeListForUnit(unit: string) {
    return sensorRangeList.value.filter(range => range.physicalUnit === unit)
  }

  function removeRangesByType(type: SensorType) {
    // eslint-disable-next-line max-len
    sensorRangeList.value = sensorRangeList.value.filter(range => range.physicalUnit !== type.physicalUnit)
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

  const getExposedSensorsAsHolderConfig = computed<HolderConfig>(() => {
    // const sensors = sensorList.value.filter(sensor => sensor.expose)
    return new HolderConfig(
      'All Sensors',
      'all-sensors',
      exposedSensors.value.map((sensor, index) => {
      return {
        channel: index + 1,
        sensor: sensor,
      }
    }))
  })

  const holderList = ref<Array<HolderConfig>>([])
  const defaultHolderList = ref<Array<HolderConfig>>(holderListPreset)

  function getHolder(id: string): HolderConfig | undefined {
    const holder = [...holderList.value, ...defaultHolderList.value].find(holder => holder.id === id)
    return holder as HolderConfig ?? undefined
  }

  function removeHolderById(id: string): void {
    const index = holderList.value.map(holder => holder.id).indexOf(id)
    if(index > -1) {
      holderList.value.splice(index, 1)
    }
  }

  function removeSensorFromHolder(
    holderId: string,
    sensorConfig: TAssignedSensor
  ) {
    const holder = getHolder(holderId)
    if(holder) {
      const index = holder.sensors.indexOf(sensorConfig)
      if(index > -1) {
        holder.sensors.splice(index, 1)
      }
    }
  }

  function addSensorToHolder(holderId: string) {
    const holder = getHolder(holderId)
    if(holder) {
      const channels = holder.sensors.map(sensor => sensor.channel).sort()
      // Note: Apparently, 255 is the limit of the firmware according to CB
      if(channels.length >= 255) { return }
      holder.sensors.push({
        channel: findNextFree(channels),
        sensor: sensorList.value[0]
      })
    }
  }

  function addHolder(id: string, name: string) {
    const holder = new HolderConfig(name, id, sensorListPreset.slice(0, 3)
      .map((preset, index) => {
      return {
        channel: index + 1,
        sensor: preset
      }
    }))
    holderList.value.push(holder)
  }

  function holderIDIsViable(id: string): boolean {
    return ![...holderList.value, ...defaultHolderList.value].map(holder => holder.id).includes(id)
  }

  const activeHolder = computed<HolderConfig | undefined>(() => {
    const id = activeSTH.value?.holderConfigId
    if(!id) return undefined
    return getHolder(id)
  })

  const hasHolder = computed<boolean>(() => {
    return activeHolder.value !== undefined
  })

  return {
    sensorList,
    addSensor,
    clearSensorList,
    removeSensor,
    STHDeviceList,
    updateSTHDeviceList,
    STHDevicesLoading,
    STUDeviceLoading,
    updateSTUDeviceList,
    STUDeviceList,
    activeSTU,
    activeSTH,
    deselectSTHDevices,
    sensorDimensionList,
    removeDimension,
    addSensorDimension,
    sensorRangeList,
    sensorRangeListForUnit,
    removeRangesByType,
    addSensorRange,
    holderList,
    removeHolderById,
    removeSensorFromHolder,
    addSensorToHolder,
    addHolder,
    holderIDIsViable,
    exposedSensors,
    getExposedSensorsAsHolderConfig,
    canUnexposeSensor,
    getHolder,
    activeHolder,
    hasSTU,
    hasSTH,
    checkSTUConnection,
    clearSTHDeviceList,
    hasHolder,
    defaultHolderList
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

// eslint-disable max-line-width
const sensorListPreset = Array<Sensor>(
  new Sensor('Acceleration', 'g', -100, 100, true, 'X Axis 100g'),
  new Sensor('Acceleration', 'g', -40, 40, true, 'Y Axis 40'),
  new Sensor('Acceleration', 'g', -40, 40, true, 'Z Axis 40'),
  new Sensor('Acceleration', 'g', -40, 40, true, 'X Axis 40'),
  new Sensor('Temperature', '°C', 0, 1000, true, 'Tool Temperature'),
  new Sensor('Light', 'cd', 0, 1000, true, 'Light'),
  new Sensor('Backpack', '-', 0, 0, true, 'Backpack-Slot Channel 1'),
  new Sensor('Backpack', '-', 0, 0, true, 'Backpack-Slot Channel 2'),
  new Sensor('Backpack', '-', 0, 0, true, 'Backpack-Slot Channel 3'),
  new Sensor('Voltage', 'V', 0, 3.7, true, 'Battery Voltage')
)

const holderListPreset = Array<HolderConfig>(
  new HolderConfig('CIRP TWM', 'cirp-twm', [
    {channel: 1, sensor: sensorListPreset[0]},
  ]),
  new HolderConfig('IFT Default 3AX', 'default-sth', [
    {channel: 1, sensor: sensorListPreset[0]},
    {channel: 2, sensor: sensorListPreset[1]},
    {channel: 3, sensor: sensorListPreset[2]},
    {channel: 4, sensor: sensorListPreset[3]},
    {channel: 5, sensor: sensorListPreset[4]},
    {channel: 6, sensor: sensorListPreset[5]},
    {channel: 7, sensor: sensorListPreset[6]},
    {channel: 8, sensor: sensorListPreset[7]},
    {channel: 9, sensor: sensorListPreset[8]},
    {channel: 10, sensor: sensorListPreset[9]},
  ]),
  new HolderConfig('IFT Old 1AX', 'sth-old', [
    {channel: 1, sensor: sensorListPreset[0]},
  ])
)