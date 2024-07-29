<script setup lang="ts">
import { Ref } from 'vue';
import { STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import EditableInput from '@/components/elements/inputs/EditableInput.vue';
import { EditState } from '@/components/elements/buttons/types.ts';
import Button from 'primevue/button';
// eslint-disable-next-line max-len
import ConnectionButton from '@/components/elements/buttons/ConnectionButton.vue';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';

const store = useHardwareStore()

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
}
</script>

<template>
  <DataTable
    :value="store.getSTHDeviceList"
    :loading="store.STHDevicesLoading">
    <Column
      header="ID">
      <template #body="{ data }: { data: STHDevice }">
        {{ data.Meta().device_number }}
      </template>
    </Column>
    <Column header="Name">
      <template #body="{ data, index }: { data: STHDevice, index: number }">
        <EditableInput
          :id="`mac-${data.Meta().mac_address}`"
          :regex="data.regex"
          :initial-value="data.Meta().name"
          :disabled="false"
          placeholder="Device Name"
          :save-fn="(
            state: Ref<EditState>,
            content: string,
            focused: Ref<boolean>
          ) => save(state, content, focused, devices[index] as STHDevice)" />
      </template>
    </Column>
    <Column
      header="MAC">
      <template #body="{ data }: { data: STHDevice }">
        {{ data.Meta().mac_address }}
      </template>
    </Column>
    <Column
      header="MAC">
      <template #body="{ data }: { data: STHDevice }">
        {{ data.getRssiRepr() }}
      </template>
    </Column>
    <Column header="Actions">
      <template #body="{ data }: { data: STHDevice }">
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
    </Column>
  </DataTable>
</template>

<style scoped>

</style>