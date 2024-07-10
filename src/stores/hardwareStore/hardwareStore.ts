import { defineStore } from 'pinia';
import { computed, ComputedRef, Ref, ref } from 'vue';
import { Sensor } from './classes/Sensor.ts';

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

  return {getSensorList, addSensor, clearSensorList, removeSensor}
})