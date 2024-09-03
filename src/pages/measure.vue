<script setup lang="ts">

import DefaultLayout from '@/layouts/DefaultLayout.vue';
import Heading3 from '@/components/typography/heading/Heading3.vue';
import Chart from '@/components/elements/Chart.vue';
import Button from 'primevue/button';
import ToggleSwitch from 'primevue/toggleswitch';
import InputNumber from 'primevue/inputnumber';
import InputGroup from 'primevue/inputgroup';
import { useRouter } from 'vue-router';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import Heading5 from '@/components/typography/heading/Heading5.vue';
import {
  updateChartData,
  useMeasurementStore,
  useMeasurementWebsocket
} from '@/stores/measurementStore/measurementStore.ts';
import { ref } from 'vue';
import { ChartData } from 'chart.js';

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
          first: 1,
          second: 0,
          third: 0,
          mac: hwStore.activeSTH?.getMacAddress(),
          time: mStore.acquisitionTime
        }));
      })
    }
  } else {
    close()
  }
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
      <Chart
        ref="chart"
        class="flex flex-col flex-grow"
        :data="chartData"
      />
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
      </div>
    </div>
  </DefaultLayout>
</template>

<style scoped>

</style>