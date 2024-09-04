<script setup lang="ts">
import Button from 'primevue/button';
import Chip from 'primevue/chip';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import SensorTable from '@/components/elements/tables/SensorTable.vue';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import {
  SensorRange,
  SensorType
} from '@/stores/hardwareStore/classes/Sensor.ts';

const store = useHardwareStore()

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
</script>

<template>
  <DefaultLayout>
    <div class="flex flex-col">
      <div
        class="flex flex-row justify-between border-b border-gray-200 pb-3 mb-3"
      >
        <div>
          <h2>Global Sensor Table</h2>
          <h6>
            The general sensor table.
            Here you can define what is accessible globally.
          </h6>
        </div>
        <Button
          outlined
          label="Add"
          icon="pi pi-plus"
        />
      </div>
      <SensorTable />
      <div
        class="
        flex flex-col
        border-t border-b border-gray-200
        py-3 my-3"
      >
        <h2 class="text-lg font-medium">
          Sensor Templates
        </h2>
        <h6 class="mb-2">
          All sensor types (physical dimensions) and their associated ranges
          can be managed here. Deletion is only possible if the respective
          range or type is not in use.
        </h6>
        <div class="flex flex-row">
          <div class="flex flex-col mr-5">
            <h3 class="mb-3 font-medium">
              Sensor Types
            </h3>
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
          <div class="flex flex-col">
            <h3 class="mb-3 font-medium">
              Available Ranges
            </h3>
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
    </div>
  </DefaultLayout>
</template>

<style scoped>

</style>