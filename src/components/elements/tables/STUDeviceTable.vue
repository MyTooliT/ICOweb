<script setup lang="ts">
//import { Ref } from 'vue';
//import { STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
//import { EditState } from '@/components/elements/buttons/types.ts';
// eslint-disable-next-line max-len
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { STUDevice } from '@/stores/hardwareStore/classes/STUDevice.ts';

const store = useHardwareStore()

/*
async function save(
  state: Ref<EditState>,
  content: string,
  focused: Ref<boolean>,
  device: STHDevice
) {
  state.value = 'loading'
  await device.setName(content)
  state.value = 'readyToEdit'
  focused.value = false
}*/
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
    <!--    <Column header="Actions">
      <template #body="{ data }: { data: STUDevice }">
        <ConnectionButton
          class="mr-3"
          :device="data"
          @connect="() => data.Connection().connect()"
          @disconnect="() => data.Connection().disconnect()"
        />
        <Button
          rounded
          size="small"
          label="Measure"
          icon="pi pi-chart-bar"
          :disabled="data.Connection()
            .getConnectionStatus() !== 'connected'"
          @click="$router.push('/measure')"
        />
      </template>
    </Column>-->
  </DataTable>
</template>

<style scoped>

</style>