<script setup lang="ts">
import { STUDevice } from '@/stores/hardwareStore/classes/STUDevice.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import { useToast } from 'primevue/usetoast';
import {useDisable} from '@/utils/useDisable.ts';

const toast = useToast()
const { featureEnabled } = useDisable()

defineProps<{ stu: STUDevice }>()

const {
  loading: resetLoading,
  call: resetReload
} = useLoadingHandler(async (data: STUDevice) => { await data.reset() })

const {
  loading: enableLoading,
  call: enableReload
} = useLoadingHandler(async (data: STUDevice) => { await data.enableOTA() })

const {
  loading: disableLoading,
  call: disableReload
} = useLoadingHandler(async (data: STUDevice) => { await data.disableOTA() })
</script>

<template>
  <DataTable :value="[stu]">
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
          :loading="resetLoading"
          @click="resetReload(data).catch((e: Error) => toast.add({
            severity: 'error',
            summary: e.name,
            detail: e.message,
            life: 3000,
            group: 'default'
          }))"
        />
        <Button
          v-if="featureEnabled('OTA')"
          rounded
          size="small"
          label="Enable OTA"
          class="mx-3"
          icon="pi pi-sync"
          :loading="enableLoading"
          :disabled="['enabled', 'disabling'].includes(data.getOTAState())"
          @click="enableReload(data).catch((e: Error) => toast.add({
            severity: 'error',
            summary: e.name,
            detail: e.message,
            life: 3000,
            group: 'default'
          }))"
        />
        <Button
          v-if="featureEnabled('OTA')"
          rounded
          size="small"
          label="Disable OTA"
          icon="pi pi-sync"
          :loading="disableLoading"
          :disabled="['disabled', 'enabling'].includes(data.getOTAState())"
          @click="disableReload(data).catch((e: Error) => toast.add({
            severity: 'error',
            summary: e.name,
            detail: e.message,
            life: 3000,
            group: 'default'
          }))"
        />
      </template>
    </Column>
  </DataTable>
</template>