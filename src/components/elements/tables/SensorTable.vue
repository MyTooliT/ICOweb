<script setup lang="ts">
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { Sensor } from '@/stores/hardwareStore/classes/Sensor.ts';

const store = useHardwareStore()
</script>

<template>
  <DataTable
    :value="store.sensorList"
  >
    <Column
      header="Ch.">
      <template #body="{ data }: { data: Sensor }">
        {{ data.getChannel() }}
      </template>
    </Column>
    <Column
      header="Type">
      <template #body="{ data }: { data: Sensor }">
        {{ data.getPhysicalDimension() }}
      </template>
    </Column>
    <Column
      header="Range">
      <template #body="{ data }: { data: Sensor }">
        {{ data.getSensorRange().text() }}
      </template>
    </Column>
    <Column
      header="Name">
      <template #body="{ data }: { data: Sensor }">
        {{ data.getName() }}
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>

</style>