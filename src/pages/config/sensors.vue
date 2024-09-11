<script setup lang="ts">
import Button from 'primevue/button';
import Chip from 'primevue/chip';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import SensorTable from '@/components/elements/tables/SensorTable.vue';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import {
  Sensor,
  SensorRange,
  SensorType
} from '@/stores/hardwareStore/classes/Sensor.ts';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
// eslint-disable-next-line max-len
import NewSensorTypeModal from '@/components/elements/modals/NewSensorTypeModal.vue';
// eslint-disable-next-line max-len
import NewSensorRangeModal from '@/components/elements/modals/NewSensorRangeModal.vue';
import {
  onBeforeMount,
  onMounted
} from 'vue';
import TextBlock from '@/components/elements/misc/TextBlock.vue';

const store = useHardwareStore()
const generalStore = useGeneralStore()

function dimensionRemovable(dim: SensorType): boolean {
  // eslint-disable-next-line max-len
  const isUnused = store.sensorList.map(sensor => sensor.sensorType.repr).indexOf(dim.repr) === -1
  const isLastItem = store.sensorDimensionList.length === 1
  return isUnused && !isLastItem
}

function rangeRemovable(r: SensorRange): boolean {
  // eslint-disable-next-line max-len
  const isUnused = store.sensorList.map(sensor => sensor.sensorRange.getRangeRepr()).indexOf(r.getRangeRepr()) === -1
  const isLastItem = store.sensorRangeListForUnit(r.physicalUnit).length === 1
  return isUnused && !isLastItem
}

function handleNewSensor(): void {
  const { physicalDimension, physicalUnit } = store.sensorDimensionList[0]
  const {
    upperBound,
    lowerBound
  } = store.sensorRangeListForUnit(physicalUnit)[0]
  const sens = new Sensor(
    physicalDimension,
    physicalUnit,
    lowerBound,
    upperBound,
    true,
    'New Sensor'
  );
  store.addSensor(sens)
}

function handleNewRange() {
  generalStore.newRangeModalVisible = true
}

function handleNewType() {
  generalStore.newTypeModalVisible = true
}

onBeforeMount(() => {
  console.log('before mount');
})

onMounted(() => {
  console.log('mounted');
})
</script>

<template>
  <DefaultLayout>
    <div class="flex flex-col">
      <TextBlock
        heading="Global Sensor Table"
        subheading="
          The general sensor table.
          Here you can define what is accessible globally."
        @button-click="handleNewSensor"
      />
      <SensorTable />
      <TextBlock
        heading="Sensor Templates"
        subheading="
          All sensor types (physical dimensions) and their associated ranges
          can be managed here. Deletion is only possible if the respective
          range or type is not in use."
        :border="false"
        :button="false"
        class="mt-3"
      />
      <div class="flex flex-row">
        <div class="flex flex-col">
          <div class="flex flex-row items-start">
            <h3 class="mb-3 font-medium">
              Sensor Types
            </h3>
            <Button
              icon="pi pi-plus"
              aria-label="Add sensor type"
              size="small"
              link
              class="!p-0"
              @click="handleNewType"
            />
            <NewSensorTypeModal />
          </div>
          <Chip
            v-for="dim in store.sensorDimensionList"
            :key="dim"
            :label="dim.repr"
            :removable="dimensionRemovable(dim)"
            class="mb-1 border-primary border"
            @remove="() => {
              store.removeDimension(dim)
              store.removeRangesByType(dim)
            }"
          />
        </div>
        <div class="border-gray-200 border-x mx-5" />
        <div class="flex flex-col">
          <div class="flex flex-row items-start">
            <h3 class="mb-3 font-medium">
              Available Ranges
            </h3>
            <Button
              icon="pi pi-plus"
              aria-label="Add sensor range"
              size="small"
              link
              class="!p-0"
              @click="handleNewRange"
            />
            <NewSensorRangeModal />
          </div>
          <div
            v-for="dim in store.sensorDimensionList"
            :key="dim.repr"
            class="flex flex-row"
          >
            <Chip
              v-for="range in store.sensorRangeList
                .filter(r => r.physicalUnit === dim.physicalUnit)"
              :key="range"
              :label="range.getRangeRepr()"
              :removable="rangeRemovable(range)"
              class="mb-1 mr-1 border-primary border"
            />
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<style scoped>

</style>