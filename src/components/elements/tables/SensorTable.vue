<script setup lang="ts">
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ToggleSwitch from 'primevue/toggleswitch';
import Button from 'primevue/button';
import Select from 'primevue/select';
import {
  Sensor,
  SensorRange
} from '@/stores/hardwareStore/classes/Sensor.ts';
import EditableInput from '@/components/elements/inputs/EditableInput.vue';
import { Ref } from 'vue';
import { EditState } from '@/components/elements/buttons/types.ts';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';

const store = useHardwareStore()
const gs = useGeneralStore()


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
          <ToggleSwitch v-model="data.expose" />
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
        <Button
          rounded
          size="small"
          label="Delete"
          icon="pi pi-times"
          icon-pos="right"
          severity="danger"
          @click="store.removeSensor(data)"
        />
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>

</style>