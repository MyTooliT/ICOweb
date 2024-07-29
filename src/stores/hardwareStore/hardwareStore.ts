import { defineStore } from 'pinia';
import {
  computed,
  ComputedRef,
  Ref,
  ref
} from 'vue';
import { Sensor } from './classes/Sensor.ts';
import { STHDevice } from './classes/STHDevice.ts';
import {
  getSTHDevicesMeta,
  getSTUMAC
} from '@/api/requests.ts';
import { consumeNewMetadata } from './helper.ts';
import { STUDevice } from '@/stores/hardwareStore/classes/STUDevice.ts';

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
  const STHDevicesLoading: Ref<boolean> = ref(false)
  async function updateSTHDeviceList(): Promise<void> {
    STHDevicesLoading.value = true
    const meta = await getSTHDevicesMeta()
    _STHDeviceList.value = consumeNewMetadata(_STHDeviceList.value, meta)
    STHDevicesLoading.value = false
  }

  const _STUDeviceList: Ref<Array<STUDevice>> = ref([])
  function initializeSTUDeviceList(): void {
    _STUDeviceList.value.push(new STUDevice({
      name: 'STU 1',
      device_number: 1
    }))
  }
  const getSTUDeviceList: ComputedRef<Array<STUDevice>> = computed(() => {
    return _STUDeviceList.value
  })
  const STUDeviceLoading: Ref<boolean> = ref(false)
  async function updateSTUDeviceList(limit: number = 1): Promise<void> {
    STUDeviceLoading.value = true
    _STUDeviceList.value = []
    for(let i = limit; i <= limit; i++) {
      try {
        const mac = await getSTUMAC(i)
        _STUDeviceList.value.push(new STUDevice({
          name: `STU ${i}`,
          device_number: i,
          mac_address: mac
        }))
      } catch(e) {}
    }
    STUDeviceLoading.value = false
  }

  return {
    getSensorList,
    addSensor,
    clearSensorList,
    removeSensor,
    getSTHDeviceList,
    updateSTHDeviceList,
    STHDevicesLoading,
    STUDeviceLoading,
    initializeSTUDeviceList,
    getSTUDeviceList,
    updateSTUDeviceList
  }
})