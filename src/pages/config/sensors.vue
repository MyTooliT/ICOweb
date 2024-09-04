<script setup lang="ts">
import Button from 'primevue/button';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import SensorTable from '@/components/elements/tables/SensorTable.vue';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { SensorType } from '@/stores/hardwareStore/classes/Sensor.ts';

const store = useHardwareStore()

function dimensionRemovable(dim: SensorType): boolean {
  return store.sensorList.map(sensor => sensor.sensorType)
    .indexOf(dim) === -1
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
      <div class="
        flex flex-col
        border-t border-b border-gray-200
        py-3 my-3"
      >
        <h2>Sensor Dimensions</h2>
        <h6>All Sensor </h6>
      </div>
      <div class="flex flex-row">
<!--        <Chip
          v-for="dim in store.sensorDimensionList"
          :key="dim"
          :label="dim.repr"
          :removable="dimensionRemovable(dim)"
          @remove="store.removeDimension(dim)"
        />-->
      </div>
    </div>
  </DefaultLayout>
</template>

<style scoped>

</style>