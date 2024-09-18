<script setup lang="ts">
// eslint-disable-next-line max-len
import { EditState } from '@/components/elements/buttons/types.ts';
import EditableInput from '@/components/elements/inputs/EditableInput.vue';
import { STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import { Ref } from 'vue';

const store = useHardwareStore()

async function save(
  state: Ref<EditState>,
  content: string,
  focused: Ref<boolean>,
  device: STHDevice
) {
  console.log(content);
  state.value = 'loading'
  await device.setName(content)
  state.value = 'readyToEdit'
  focused.value = false
}

function rowClass(data: STHDevice) {
  // eslint-disable-next-line max-len
  return [{'!bg-primary-container !text-on-primary-container': data.getSelected()}]
}
</script>

<template>
  <DataTable
    :value="store.getSTHDeviceList"
    :loading="store.STHDevicesLoading"
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
        <EditableInput
          :id="`mac-${data.getMacAddress()}`"
          :regex="data.getRegex()"
          :initial-value="data.getName()"
          :disabled="false"
          :valid-fn="() => true"
          placeholder="Device Name"
          :save-fn="(
            state: Ref<EditState>,
            content: string,
            focused: Ref<boolean>
          ) => save(state, content, focused, data)" />
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
    <Column header="Actions">
      <template #body="{ data }: { data: STHDevice }">
        <!--
        <ConnectionButton
          class="mr-3"
          :device="data"
          @connect="() => data.connect()"
          @disconnect="() => data.disconnect()"
        />
        -->
        <Button
          rounded
          size="small"
          :label="data.getSelected() ? 'Deselect' : 'Select'"
          @click="() => {
            if(data.getSelected()) {
              store.deselectSTHDevices()
            } else {
              store.deselectSTHDevices()
              data.setSelected(true)
            }
          }"
        />
        <Button
          rounded
          class="ml-3"
          size="small"
          label="Measure"
          icon="pi pi-chart-bar"
          :disabled="!data.getSelected()"
          @click="$router.push('/measure')"
        />
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>

</style>