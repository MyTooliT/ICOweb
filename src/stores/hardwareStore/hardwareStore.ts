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
  getSTUDevices
} from '@/api/requests.ts';
import { consumeNewMetadata } from './helper.ts';
import { STUDevice } from '@/stores/hardwareStore/classes/STUDevice.ts';
import { deserializeWithClassParsing } from '@/stores/hardwareStore/localStoreParser.ts';

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
    getSensorList,
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
    deselectSTHDevices
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