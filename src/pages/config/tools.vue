<script setup lang="ts">
import Panel from 'primevue/panel';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { Sensor } from '@/stores/hardwareStore/classes/Sensor.ts';
import DeleteButton from '@/components/elements/buttons/DeleteButton.vue';
import AddHolderModal from '@/components/elements/modals/AddHolderModal.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';

const hw = useHardwareStore()
const gs = useGeneralStore()
</script>

<template>
  <DefaultLayout>
    <TextBlock
      heading="Tool Holder Configuration Table"
      subheading="
        Define and edit usable tool holder templates
        and their sensor configurations"
      @button-click="gs.addHolderModalVisible = true"
    />
    <div class="flex flex-wrap gap-3">
      <Panel
        v-for="holder in hw.holderList"
        :key="holder.id"
        class="flex-auto basis-1/3">
        <template #header>
          <div class="flex justify-between items-center w-full">
            <h5 class="font-medium text-lg">
              {{ holder.name }}
              <span class="font-normal">({{ holder.id }})</span>
            </h5>
            <div class="flex flex-row gap-3">
              <Button
                icon="pi pi-pencil"
                rounded
                outlined
                size="small"
              />
              <Button
                icon="pi pi-times"
                severity="danger"
                rounded
                outlined
                size="small"
                @click="hw.removeHolderById(holder.id)"
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
              #body="{ data }: { data: { channel: number, sensor: Sensor } }">
              <InputNumber
                v-model="data.channel"
                :min="1"
                :max="255"
                input-class="w-16"
              />
            </template>
          </Column>
          <Column
            header="Connected Sensor"
          >
            <template
              #body="{ data }: { data: { channel: number, sensor: Sensor } }">
              <Select
                v-model="data.sensor"
                class="w-full"
                :options="hw.sensorList"
                :option-label="(item: Sensor) => item.getFullRepr()"
              />
            </template>
          </Column>
          <Column
            header="Action"
          >
            <template
              #body="{ data }: { data: { channel: number, sensor: Sensor } }">
              <DeleteButton
                @click="hw.removeSensorFromHolder(holder.id, data)"
              />
            </template>
          </Column>
        </DataTable>
        <div class="w-full flex justify-center mt-3">
          <Button
            icon="pi pi-plus"
            rounded
            outlined
            size="small"
            label="Add Sensor"
            @click="hw.addSensorToHolder(holder.id)"
          />
        </div>
      </Panel>
    </div>
    <AddHolderModal />
  </DefaultLayout>
</template>

<style scoped>

</style>