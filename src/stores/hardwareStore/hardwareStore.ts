import { defineStore } from 'pinia';
import {
  computed,
  ComputedRef,
  Ref,
  ref
} from 'vue';
import {
  Sensor,
  SensorRange,
  SensorType
} from './classes/Sensor.ts';
import { STHDevice } from './classes/STHDevice.ts';
import {
  getSTHDevicesMeta,
  getSTUDevices
} from '@/api/requests.ts';
import { consumeNewMetadata } from './helper.ts';
import { STUDevice } from '@/stores/hardwareStore/classes/STUDevice.ts';
// eslint-disable-next-line max-len
import { deserializeWithClassParsing } from '@/stores/hardwareStore/localStoreParser.ts';

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

  const sensorDimensionList = ref<Array<SensorType>>([
    new SensorType('Acceleration', 'g'),
    new SensorType('Temperature', 'K'),
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
  const sensorRangeList = ref<Array<SensorRange>>([
    new SensorRange('g', -100, 100),
    new SensorRange('g', -40, 40),
    new SensorRange('K', 0, 1000),
    new SensorRange('cd', 0, 1000),
    new SensorRange('V', 0, 3.7),
    new SensorRange('-', 0, 0)
  ])

  function sensorRangeListForUnit(unit: string) {
    return sensorRangeList.value.filter(range => range.physicalUnit === unit)
  }

  function removeRangesByType(type: SensorType) {
    // eslint-disable-next-line max-len
    sensorRangeList.value = sensorRangeList.value.filter(range => range.physicalUnit !== type.physicalUnit)
  }

  const _STHDeviceList: Ref<Array<STHDevice>> = ref([])
  const getSTHDeviceList: ComputedRef<Array<STHDevice>> = computed(() => {
    return _STHDeviceList.value
  })
  const STHDevicesLoading: Ref<boolean> = ref(false)
  async function updateSTHDeviceList(): Promise<void> {
    STHDevicesLoading.value = true
    const meta = await getSTHDevicesMeta()
    _STHDeviceList.value = consumeNewMetadata(_STHDeviceList.value, meta)
    STHDevicesLoading.value = false
  }
  const activeSTH = computed<STHDevice | undefined>(() => {
    return _STHDeviceList.value.filter(entry => entry.getSelected())[0]
  })
  function deselectSTHDevices() {
    _STHDeviceList.value.forEach(device => device.setSelected(false));
  }
  const _STUDeviceList: Ref<Array<STUDevice>> = ref([])
  const getSTUDeviceList: ComputedRef<Array<STUDevice>> = computed(() => {
    return _STUDeviceList.value
  })
  const STUDeviceLoading: Ref<boolean> = ref(false)
  async function updateSTUDeviceList(): Promise<void> {
    STUDeviceLoading.value = true
    try {
      const meta = await getSTUDevices()
      _STUDeviceList.value = meta.map(entry => {
        return new STUDevice(
          entry.device_number,
          entry.name,
          entry.mac_address
        )
      })
    } catch(e) {
      throw e
    }
    STUDeviceLoading.value = false
  }
  const activeSTU = computed<STUDevice>(() => {
    // TODO: Implement more STU support
    return _STUDeviceList.value[0]
  })

  return {
    sensorList,
    addSensor,
    clearSensorList,
    removeSensor,
    getSTHDeviceList,
    updateSTHDeviceList,
    STHDevicesLoading,
    STUDeviceLoading,
    getSTUDeviceList,
    updateSTUDeviceList,
    _STUDeviceList,
    _STHDeviceList,
    activeSTU,
    activeSTH,
    deselectSTHDevices,
    sensorDimensionList,
    removeDimension,
    sensorRangeList,
    sensorRangeListForUnit,
    removeRangesByType
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
  new Sensor('Acceleration', 'g', -100, 100, true, 11, 'X Axis 100g'),
  new Sensor('Acceleration', 'g', -40, 40, true, 2, 'Y Axis 40'),
  new Sensor('Acceleration', 'g', -40, 40, true, 3, 'Z Axis 40'),
  new Sensor('Acceleration', 'g', -40, 40, true, 4, 'X Axis 40'),
  new Sensor('Temperature', 'K', 0, 1000, true, 5, 'Tool Temperature'),
  new Sensor('Light', 'cd', 0, 1000, true, 6, 'Light'),
  new Sensor('Backpack', '-', 0, 0, true, 7, 'Backpack-Slot Channel 1'),
  new Sensor('Backpack', '-', 0, 0, true, 8, 'Backpack-Slot Channel 2'),
  new Sensor('Backpack', '-', 0, 0, true, 9, 'Backpack-Slot Channel 3'),
  new Sensor('Voltage', 'V', 0, 3.7, true, 10, 'Battery Voltage')
)