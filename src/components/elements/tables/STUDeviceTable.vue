<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { STUDevice } from '@/stores/hardwareStore/classes/STUDevice.ts';

const store = useHardwareStore()
</script>

<template>
  <DataTable
    :value="store.getSTUDeviceList"
    :loading="store.STUDeviceLoading">
    <Column
      header="ID">
      <template #body="{ data }: { data: STUDevice }">
        {{ data.Meta().device_number }}
      </template>
    </Column>
    <Column header="Name">
      <template #body="{ data }: { data: STUDevice }">
        {{ data.Meta().name }}
      </template>
    </Column>
    <Column
      header="MAC">
      <template #body="{ data }: { data: STUDevice }">
        {{ data.Meta().mac_address }}
      </template>
    </Column>
    <Column header="Actions">
      <template #body="{ data }: { data: STUDevice }">
        <Button
          rounded
          size="small"
          label="Reset"
          icon="pi pi-sync"
          @click="data.Connection().reset()"
        />
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>

</style>