import { defineStore } from 'pinia';
import {
  computed,
  ComputedRef,
  Ref,
  ref
} from 'vue';
import { Sensor } from './classes/Sensor.ts';
import { STHDevice } from './classes/STHDevice.ts';
import { getSTHDevicesMeta } from '@/api/requests.ts';
import { consumeNewMetadata } from './helper.ts';

export const useHardwareStore = defineStore('hardware', () => {
  const _sensorList: Ref<Array<Sensor>> = ref([]);
  const getSensorList: ComputedRef<Array<Sensor>> = computed(() => {
    return _sensorList.value
  })
  function addSensor(newSensor: Sensor) {
    _sensorList.value.push(newSensor);
  }
  function clearSensorList() {
    _sensorList.value = []
  }
  function removeSensor(sensor: Sensor) {
    const index = _sensorList.value.indexOf(sensor);
    if (index > -1) {
      _sensorList.value.splice(index, 1);
    }
  }

  const _STHDeviceList: Ref<Array<STHDevice>> = ref([])
  const getSTHDeviceList: ComputedRef<Array<STHDevice>> = computed(() => {
    return _STHDeviceList.value
  })
  async function updateSTHDeviceList(): Promise<void> {
    STHDevicesLoading.value = true
    const meta = await getSTHDevicesMeta()
    _STHDeviceList.value = consumeNewMetadata(_STHDeviceList.value, meta)
    STHDevicesLoading.value = false
  }
  const STHDevicesLoading: Ref<boolean> = ref(false)

  return {
    getSensorList,
    addSensor,
    clearSensorList,
    removeSensor,
    getSTHDeviceList,
    updateSTHDeviceList,
    STHDevicesLoading
  }
})