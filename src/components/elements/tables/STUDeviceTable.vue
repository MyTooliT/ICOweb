<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { STUDevice } from '@/stores/hardwareStore/classes/STUDevice.ts';
import { ref } from 'vue';

const store = useHardwareStore()
const toast = useToast()

const loading = ref<boolean>(false)
</script>

<template>
  <DataTable
    :value="store.getSTUDeviceList"
    :loading="store.STUDeviceLoading">
    <Column
      header="ID">
      <template #body="{ data }: { data: STUDevice }">
        {{ data.getDeviceNumber() }}
      </template>
    </Column>
    <Column header="Name">
      <template #body="{ data }: { data: STUDevice }">
        {{ data.getName() }}
      </template>
    </Column>
    <Column
      header="MAC">
      <template #body="{ data }: { data: STUDevice }">
        {{ data.getMacAddress() }}
      </template>
    </Column>
    <Column header="Actions">
      <template #body="{ data }: { data: STUDevice }">
        <Button
          rounded
          size="small"
          label="Reset"
          icon="pi pi-sync"
          :loading="loading"
          @click="async () => {
            loading = true;
            await data.reset().catch((e: Error) => toast.add({
              severity: 'error',
              summary: e.name,
              detail: e.message,
              life: 3000
            }))
            loading = false
          }"
        />
        <Button
          rounded
          size="small"
          label="Enable OTA"
          icon="pi pi-sync"
          :loading="data.getOTAState() === 'enabling'"
          :disabled="['enabled', 'disabling'].includes(data.getOTAState())"
          @click="data.enableOTA().catch((e: Error) => toast.add({
            severity: 'error',
            summary: e.name,
            detail: e.message,
            life: 3000
          }))"
        />
        <Button
          rounded
          size="small"
          label="Disable OTA"
          icon="pi pi-sync"
          :loading="data.getOTAState() === 'disabling'"
          :disabled="['disabled', 'enabling'].includes(data.getOTAState())"
          @click="data.disableOTA().catch((e: Error) => toast.add({
            severity: 'error',
            summary: e.name,
            detail: e.message,
            life: 3000
          }))"
        />
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>

</style>