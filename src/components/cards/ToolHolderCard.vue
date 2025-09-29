<script setup lang="ts">
import DeleteButton from '@/components/buttons/DeleteButton.vue';
import {
  HolderConfig,
  TAssignedSensor
} from '@/stores/hardwareStore/classes/HolderConfig.ts';
import { Sensor } from '@/stores/hardwareStore/classes/Sensor.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import InputNumber from 'primevue/inputnumber';
import Panel from 'primevue/panel';
import Select from 'primevue/select';

const hw = useHardwareStore()

withDefaults(defineProps<{
  holder: HolderConfig,
  deletable: boolean,
  editable: boolean,
}>(), {
  deletable: true,
  editable: true
})

const emits = defineEmits<{
  (event: 'removeHolder'): void,
  (event: 'removeSensor', sensor: TAssignedSensor): void,
  (event: 'addSensor'): void
}>()
</script>

<template>
  <Panel
    :header="holder.name"
    :toggleable="true"
    :collapsed="true"
    class="w-full">
    <template #header>
      <div class="flex justify-between items-center w-full">
        <h5 class="font-medium text-lg">
          {{ holder.name }}
          <span class="font-normal">({{ holder.id }})</span>
        </h5>
        <div
          v-if="editable && deletable"
          class="flex flex-row gap-3">
          <DeleteButton
            tooltip="Delete Holder"
            borderless
            @click="emits('removeHolder')"
          />
        </div>
      </div>
    </template>
    <DataTable
      :value="holder.sensors"
      size="small"
      class=""
    >
      <Column
        header="Channel"
        column-resize-mode="fit"
        class="w-16"
      >
        <template
          #body="{ data }: { data: TAssignedSensor }">
          <InputNumber
            v-model="data.channel"
            :min="1"
            :max="255"
            input-class="[width:6ch]"
          />
        </template>
      </Column>
      <Column
        header="Connected Sensor"
      >
        <template
          #body="{ data }: { data: TAssignedSensor }">
          <Select
            v-model="data.sensor"
            class="w-full"
            :options="hw.exposedSensors"
            :option-label="(item: Sensor) => item.getFullRepr()"
          />
        </template>
      </Column>
      <Column
        v-if="editable"
        header="Action"
        class="w-16"
      >
        <template
          #body="{ data }: { data: TAssignedSensor }">
          <DeleteButton
            tooltip="Remove Sensor"
            @click="emits('removeSensor', data)"
          />
        </template>
      </Column>
    </DataTable>
    <div
      v-if="editable"
      class="w-full flex justify-center mt-3">
      <Button
        icon="pi pi-plus"
        rounded
        outlined
        size="small"
        label="Add Sensor"
        @click="emits('addSensor')"
      />
    </div>
  </Panel>
</template>

<style scoped>

</style>