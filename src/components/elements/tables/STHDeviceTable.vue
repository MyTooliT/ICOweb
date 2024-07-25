<script setup lang="ts">
import {
  Ref,
  ref
} from 'vue';
import {
  MockSTHActions,
  STHDevice
} from '@/stores/hardwareStore/classes/STHDevice.ts';
import { getSTHDevicesMeta } from '@/api/requests.ts';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import EditableInput from '@/components/elements/inputs/EditableInput.vue';
import { EditState } from '@/components/elements/buttons/types.ts';

const devices = ref<STHDevice[]>([])
const devs = await getSTHDevicesMeta();
devs.forEach(entry => {
  devices.value.push(
    new STHDevice(entry, new MockSTHActions()),
  );
})
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
  <DataTable :value="devices">
    <Column field="meta.id" header="ID"></Column>
    <Column header="Name">
      <template #body="{ data, index }">
        <EditableInput
          :id="`mac-${data.meta.mac}`"
          :regex="data.meta.regex"
          :initial-value="data.meta.name"
          :disabled="false"
          placeholder="Device Name"
          :save-fn="(
            state: Ref<EditState>,
            content: string,
            focused: Ref<boolean>
            ) => save(state, content, focused, devices[index] as STHDevice)" />
      </template>
    </Column>
    <Column field="meta.mac" header="MAC"></Column>
    <Column header="RSSI">
      <template #body="slotProps">
        {{ devices[slotProps.index].getRssiRepr() }}
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>

</style>