<script setup lang="ts">
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useNumberInput } from '@/utils/useNumberInput.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import {
  computed,
  onMounted,
  ref
} from 'vue';
import { SensorType } from '@/stores/hardwareStore/classes/Sensor.ts';

const generalStore = useGeneralStore()
const hardwareStore = useHardwareStore()

const ranges = ['symmetric', 'bounded'] as const
type Ranges = typeof ranges[number]
const rangeType = ref<Ranges>('symmetric')

const sensorType = ref<SensorType>(hardwareStore.sensorDimensionList[0])

const {
  content: lowerOrSymmetricContent,
  valid: lowerOrSymmetricValid,
  visiblyInvalid: lowerOrSymmetricVisiblyInvalid,
  setVisibility: lowerOrSymmetricSetVisibility,
} = useNumberInput('NotEmpty')

const {
  content: upperContent,
  valid: upperValid,
  visiblyInvalid: upperVisiblyInvalid,
  setVisibility: upperSetVisibility,
} = useNumberInput('NotEmpty')

function handleNewRange() {
  if(!lowerOrSymmetricContent.value) return
  if(rangeType.value === 'symmetric') {
    hardwareStore.addSensorRange(
      sensorType.value.physicalUnit,
      -lowerOrSymmetricContent.value,
      lowerOrSymmetricContent.value)
  } else {
    if(!upperContent.value) return
    hardwareStore.addSensorRange(
      sensorType.value.physicalUnit,
      lowerOrSymmetricContent.value,
      upperContent.value)
  }
  generalStore.newRangeModalVisible = false
}

const valid = computed(() => {
  return (
    lowerOrSymmetricValid.value &&
    lowerOrSymmetricContent.value &&
    (rangeType.value === 'bounded'
      ? (
        upperContent.value &&
        upperValid.value &&
        lowerOrSymmetricContent.value <= upperContent.value
      )
      : true)
  )
})

onMounted(() => {
  window.addEventListener('keyup', (e) => {
    if(e.key === 'Enter' && valid.value) {
      handleNewRange()
    }
  })
})
</script>

<template>
  <Dialog
    v-model:visible="generalStore.newRangeModalVisible"
    modal
    header="Add Sensor range"
  >
    <div class="flex flew-row gap-2 mb-2">
      <div class="flex flex-col gap-2 mb-3 flex-1 flex-shrink-0">
        <label
          for="sensorTypeSelect"
          class="font-semibold">Sensor Type</label>
        <Select
          id="sensorTypeSelect"
          v-model="sensorType"
          :options="hardwareStore.sensorDimensionList"
          option-label="repr"
        />
      </div>
      <div class="flex flex-col gap-2 mb-3 flex-1 flex-shrink-0">
        <label
          for="rangeTypeSelect"
          class="font-semibold">Range Type</label>
        <Select
          id="rangeTypeSelect"
          v-model="rangeType"
          :options="ranges"
        />
      </div>
    </div>
    <div class="flex flex-row gap-2 mb-2">
      <div class="flex flex-col items-start gap-2 mb-3">
        <label
          for="type"
          class="font-semibold">
          {{ rangeType === 'symmetric' ? 'One-Sided Range' : 'Lower Bound' }}
        </label>
        <InputNumber
          id="type"
          v-model="lowerOrSymmetricContent"
          :invalid="lowerOrSymmetricVisiblyInvalid"
          autocomplete="off"
          :prefix="rangeType === 'symmetric' ? '±' : ''"
          :suffix="sensorType.physicalUnit"
          :use-grouping="false"
          :min-fraction-digits="0"
          :max-fraction-digits="3"
          placeholder="Enter value"
          @click.once="lowerOrSymmetricSetVisibility(true)"
        />
      </div>
      <div
        class="flex flex-col items-start gap-2 mb-3"
        :class="rangeType === 'symmetric' ? 'opacity-0' : 'opacity-100'">
        <label
          for="unit"
          class="font-semibold">Upper Bound</label>
        <InputNumber
          id="unit"
          v-model="upperContent"
          :invalid="upperVisiblyInvalid"
          autocomplete="off"
          :suffix="sensorType.physicalUnit"
          :use-grouping="false"
          :min-fraction-digits="0"
          :max-fraction-digits="3"
          placeholder="Enter value"
          @click.once="upperSetVisibility(true)"
        />
      </div>
    </div>
    <div class="flex justify-end gap-2">
      <Button
        type="button"
        label="Cancel"
        severity="secondary"
        @click="generalStore.newRangeModalVisible = false" />
      <Button
        type="button"
        label="Add"
        :icon="valid ? 'pi pi-check' : ''"
        class="ml-auto"
        :disabled="!valid"
        @click="handleNewRange()" />
    </div>
  </Dialog>
</template>

<style scoped>

</style>