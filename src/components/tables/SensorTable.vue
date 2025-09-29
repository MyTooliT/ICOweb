<script setup lang="ts">
import DeleteButton from '@/components/buttons/DeleteButton.vue';
import { EditState } from '@/components/buttons/types.ts';
import EditableInput from '@/components/inputs/EditableInput.vue';
import {
  Sensor,
  SensorRange
} from '@/stores/hardwareStore/classes/Sensor.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Select from 'primevue/select';
import ToggleSwitch from 'primevue/toggleswitch';
import { Ref } from 'vue';

const store = useHardwareStore()
</script>

<template>
  <DataTable
    :value="store.sensorList"
    :sort-order="1"
    size="small"
    state-storage="session"
    state-key="dt-state-demo-session"
  >
    <Column
      header="Expose">
      <template #body="{ data }: { data: Sensor }">
        <div class="w-full h-full flex  items-center">
          <ToggleSwitch
            v-model="data.expose"
            :disabled="store.canUnexposeSensor(data)" />
        </div>
      </template>
    </Column>
    <Column
      header="Type">
      <template #body="{ data }: { data: Sensor }">
        <Select
          :model-value="data.sensorType"
          :options="store.sensorDimensionList"
          option-label="repr"
          placeholder="Select Dimension"
          class="w-full"
          @change="(e) => {
            Object.assign(data.sensorType, e.value)
            Object.assign(data.sensorRange, store.sensorRangeList.filter(
              range => range.physicalUnit === data.sensorType.physicalUnit
            )[0])
          }"
        />
      </template>
    </Column>
    <Column
      header="Range">
      <template #body="{ data }: { data: Sensor }">
        <Select
          :model-value="data.sensorRange"
          :options="store.sensorRangeList.filter(
            range => range.physicalUnit === data.sensorType.physicalUnit)"
          :option-label="(entry: SensorRange) => entry.getRangeRepr()"
          class="w-full"
          placeholder="Select Range"
          @change="(e) => {
            Object.assign(data.sensorRange, e.value)
          }"
        />
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
          :valid-fn="
            (content: string) =>
              !store.sensorList.map(sensor => sensor.name).includes(content)"
          placeholder="Ch."
          :save-fn="
            (state: Ref<EditState>, content: string, focused: Ref<boolean>) =>
            {
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
        <DeleteButton
          tooltip="Delete Sensor"
          @click="store.removeSensor(data)"
        />
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>

</style>