<script setup lang="ts">
/* eslint-disable max-len */
import Chart from '@/components/elements/Chart.vue';
import Heading3 from '@/components/typography/heading/Heading3.vue';
import Heading5 from '@/components/typography/heading/Heading5.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { TAssignedSensor } from '@/stores/hardwareStore/classes/HolderConfig.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import {
  measurementChannels,
  updateChartData,
  useMeasurementStore,
  useMeasurementWebsocket
} from '@/stores/measurementStore/measurementStore.ts';
import { ChartData } from 'chart.js';
import Button from 'primevue/button';
import InputGroup from 'primevue/inputgroup';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import ToggleSwitch from 'primevue/toggleswitch';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
/* eslint-enable max-len */

const chartData = ref<ChartData<'line'>>({
  labels: [],
  datasets: [{
    label: 'Raw Data',
    data: []
  }]
})

const router = useRouter()
const hwStore = useHardwareStore()
const mStore = useMeasurementStore()
const {
  open,
  close,
  state,
  storage,
  ws
} = useMeasurementWebsocket(
  true,
  () => updateChartData(storage.value, chartData)
)

function startStopClickHandler() {
  if(state.value === 'closed') {
    if(hwStore.activeSTH?.getMacAddress()) {
      open()
      ws.value?.addEventListener('opened', () => {
        ws.value?.send(JSON.stringify({
          ...mStore.selectedChannels,
          mac: hwStore.activeSTH?.getMacAddress(),
          time: mStore.acquisitionTime
        }));
      })
    }
  } else {
    close()
  }
}

function channelSensorRepr(assignedSensor: TAssignedSensor): string {
  return `[${assignedSensor.channel}] ${assignedSensor.sensor.name}`
}

const chart = ref(undefined)
</script>

<template>
  <DefaultLayout>
    <div class="flex flex-row justify-start pb-3 mb-3 border-b">
      <Heading3 class="inline-block mr-3 !mb-0">
        Selected Devices:
        {{ hwStore.activeSTU?.getName() }} /
        {{ hwStore.activeSTH?.getName() }}
      </Heading3>
      <Button
        outlined
        icon="pi pi-pencil"
        :loading="false"
        @click="router.push('/')" />
    </div>
    <div class="flex flex-row">
      <div class="flex flex-col flex-grow">
        <Chart
          ref="chart"
          class="flex flex-col flex-grow"
          :data="chartData"
        />
      </div>
      <div class="flex flex-col flex-grow">
        <Heading5>Measure</Heading5>
        <div class="flex flex-row">
          <ToggleSwitch
            v-model="mStore.continuous"
            input-id="continuous" />
          <label
            for="continuous"
            class="ml-3">Run&nbsp;continuously</label>
        </div>
        <div class="flex flex-row justify-between mt-3">
          <InputGroup>
            <InputNumber
              v-model="mStore.acquisitionTime"
              input-id="acqTime"
              suffix=" s"
              :min="0"
              :disabled="mStore.continuous"
            />
            <Button
              :label="state === 'open' ? 'Stop Recording' : 'Start Recording'"
              class="!px-5"
              @click="startStopClickHandler"
            />
          </InputGroup>
        </div>
        <div class="flex flex-col mt-3">
          <h4 class="text-lg mt-3 mb-2">
            Selected Channels
          </h4>
          <table>
            <tr
              v-for="slot in measurementChannels"
              :key="slot"
            >
              <td>
                <div class="w-full h-full flex justify-start items-center">
                  <ToggleSwitch
                    :model-value="mStore.selectedChannels[slot] !== 0"
                    @click="() => {
                      mStore.selectedChannels[slot] === 0
                        ? mStore.selectedChannels[slot] = 1
                        : mStore.selectedChannels[slot] = 0
                    }"
                  />
                </div>
              </td>
              <td>
                <span class="capitalize">{{ slot }}</span>
              </td>
              <td>
                <Select
                  v-if="!!hwStore.activeSTH"
                  v-model="mStore.selectedChannels[slot]"
                  :options="hwStore.activeHolder?.sensors"
                  :option-value="(sens: TAssignedSensor) => sens.channel"
                  :option-label="channelSensorRepr"
                  :disabled="mStore.selectedChannels[slot] === 0 "
                  placeholder="Disabled"
                  fluid
                />
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<style scoped>

</style>