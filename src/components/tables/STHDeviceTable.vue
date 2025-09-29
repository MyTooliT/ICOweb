<script setup lang="ts">
// eslint-disable-next-line max-len
import ConnectionButton from '@/components/buttons/ConnectionButton.vue';
import RenameSTHModal from '@/components/modals/RenameSTHModal.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { HolderConfig } from '@/stores/hardwareStore/classes/HolderConfig.ts';
import { STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import { ref } from 'vue';
import Select from 'primevue/select';

const hwStore = useHardwareStore()
const store = useGeneralStore()

function rowClass(data: STHDevice) {
  // eslint-disable-next-line max-len
  return [{'!bg-primary-container !text-on-primary-container': data.isConnected()}]
}

async function handleSubmit(name: string, device: STHDevice) {
  await device.setName(name)
}

const device = ref<STHDevice | null>(null)

const {call, loading} = useLoadingHandler<void>(handleSubmit)

async function handleConnect(device: STHDevice) {
  if(hwStore.activeSTH) {
    await hwStore.activeSTH.disconnect()
    await hwStore.activeSTU.reset()
  }
  await device.connect()
}
</script>

<template>
  <DataTable
    :value="hwStore.STHDeviceList"
    :row-class="rowClass"
  >
    <Column
      header="ID">
      <template #body="{ data }: { data: STHDevice }">
        {{ data.getDeviceNumber() }}
      </template>
    </Column>
    <Column header="Name">
      <template #body="{ data }: { data: STHDevice }">
        {{ data.getName() }}
      </template>
    </Column>
    <Column
      header="MAC">
      <template #body="{ data }: { data: STHDevice }">
        {{ data.getMacAddress() }}
      </template>
    </Column>
    <Column
      header="RSSI">
      <template #body="{ data }: { data: STHDevice }">
        {{ data.getRssiRepr() }}
      </template>
    </Column>
    <Column
      header="Holder Template">
      <template #body="{ data }: { data: STHDevice }">
        <Select
          v-model="data.holderConfigId"
          :options="hwStore.holderList"
          :option-value="(holder: HolderConfig) => holder.id"
          :option-label="(holder: HolderConfig) => holder.name"
        />
      </template>
    </Column>
    <Column header="Actions">
      <template #body="{ data }: { data: STHDevice }">
        <Button
          rounded
          size="small"
          label="Rename"
          icon="pi pi-pencil"
          @click="() => {
            device = data
            store.renameSTHModalVisible = true
          }"
        />
        <ConnectionButton
          class="mx-3"
          :device="data"
          @connect="() => handleConnect(data)"
          @disconnect="() => data.disconnect()"
        />
        <Button
          rounded
          size="small"
          label="Measure"
          icon="pi pi-chart-bar"
          :disabled="!data.isConnected()"
          @click="$router.push('/measure')"
        />
      </template>
    </Column>
    <RenameSTHModal
      :regex="STHDevice.regex"
      :initial-name="device?.getName() || ''"
      :loading="loading"
      @rename="call($event, device).then(() => {
        store.renameSTHModalVisible = false
      })"
    />
  </DataTable>
</template>

<style scoped>

</style>