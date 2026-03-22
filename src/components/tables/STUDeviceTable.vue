<script setup lang="ts">
import { STUDevice } from '@/stores/hardwareStore/classes/STUDevice.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import {useDisable} from '@/utils/useDisable.ts';
import {useMessageBus} from '@/message';

const store = useHardwareStore()
const m = useMessageBus()

const { featureEnabled } = useDisable()

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
  <DataTable :value="store.STUDeviceList">
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
          @click="resetReload(data)
            .then(() => m.info('Reset Successful'))
            .catch((e: Error) => m.error(e.name, e.message))"
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
          @click="enableReload(data)
            .then(() => m.info('OTA Enabled'))
            .catch((e: Error) => m.error(e.name, e.message))"
        />
        <Button
          v-if="featureEnabled('OTA')"
          rounded
          size="small"
          label="Disable OTA"
          icon="pi pi-sync"
          :loading="disableLoading"
          :disabled="['disabled', 'enabling'].includes(data.getOTAState())"
          @click="disableReload(data)
            .then(() => m.info('OTA Disabled'))
            .catch((e: Error) => m.error(e.name, e.message))"
        />
      </template>
    </Column>
  </DataTable>
</template>