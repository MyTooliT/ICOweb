<script setup lang="ts">
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ToggleSwitch from 'primevue/toggleswitch';
import Button from 'primevue/button';
import Select from 'primevue/select';
import { Sensor } from '@/stores/hardwareStore/classes/Sensor.ts';
import EditableInput from '@/components/elements/inputs/EditableInput.vue';
import { Ref } from 'vue';
import { EditState } from '@/components/elements/buttons/types.ts';

const store = useHardwareStore()
</script>

<template>
  <DataTable
    :value="store.sensorList"
    sort-field="channel"
    :sort-order="1"
    size="small"
    :resizable-columns="true"
  >
    <Column
      header="Expose">
      <template #body="{ data }: { data: Sensor }">
        <ToggleSwitch v-model="data.expose" />
      </template>
    </Column>
    <Column
      header="Ch."

    >
      <template #body="{ data }: { data: Sensor }">
        <EditableInput
          :id="`channel-${data.getChannel()}`"
          :regex="new RegExp('^\d*')"
          :initial-value="data.getChannel().toString()"
          :disabled="false"
          placeholder="Ch."
          classes="w-8 flex-grow"
          :save-fn="(
            state: Ref<EditState>,
            content: string,
            focused: Ref<boolean>
          ) => {
            state.value = 'loading'
            data.setChannel(Number(content))
            focused.value = false
            state.value = 'readyToEdit'
          }"
        />
      </template>
    </Column>
    <Column
      header="Type">
      <template #body="{ data }: { data: Sensor }">
        <Select
          :model-value="data.sensorType"
          :options="store.sensorDimensionList"
          optionLabel="repr"
          placeholder="Select Dimension"
          class="w-full"
          @change="(e) => {
            Object.assign(data.sensorType, e.value)
          }"
        />
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
        <EditableInput
          :id="`channel-${data.getName()}`"
          :regex="new RegExp('^\d*')"
          :initial-value="data.getName()"
          :disabled="false"
          placeholder="Ch."
          :save-fn="(state: Ref<EditState>, content: string, focused: Ref<boolean>) => {
            state.value = 'loading'
            data.setName(content)
            focused.value = false
            state.value = 'readyToEdit'
          }"
        />
      </template>
    </Column>
    <Column
      header="Action"
    >
      <template #body="{ data }: { data: Sensor }">
        <Button
          rounded
          size="small"
          label="delete"
          icon="pi pi-times"
          severity="danger"
          @click="store.removeSensor(data)"
        />
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>

</style>