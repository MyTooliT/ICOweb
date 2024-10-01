<script setup lang="ts">
/* eslint-disable max-len */
import Chart from '@/components/elements/Chart.vue';
import CustomSlider from '@/components/elements/forms/CustomSlider.vue';
import NamedInput from '@/components/elements/forms/NamedInput.vue';
import ADCDrawer from '@/components/elements/misc/ADCDrawer.vue';
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useADCStore } from '@/stores/ADCStore/ADCStore.ts';
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
import Checkbox from 'primevue/checkbox';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
//import ToggleSwitch from 'primevue/toggleswitch';
import {
  computed,
  ref
} from 'vue';
import { useRouter } from 'vue-router';
/* eslint-enable max-len */

const chartData = ref<ChartData<'line'>>({
  labels: [],
  datasets: []
})

const router = useRouter()
const hwStore = useHardwareStore()
const mStore = useMeasurementStore()
const adcStore = useADCStore()
const {
  open,
  close,
  state,
  storage,
  ws
} = useMeasurementWebsocket(
  true,
  () => wrapUpdate()
)

function wrapUpdate() {
  updateChartData(
    storage.value,
    chartData,
    mStore.activeChannels,
    drawIncrement.value,
    windowWidth.value
  )
}

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

// Chart will draw every <displayDelta> value from data
const drawIncrement = ref<number>(10)

// Floating calculations like floatingAverage or IFTValue use this window
const windowWidth = ref<number>(50)

// Disables measuring if not all requirements are met
const canMeasure = computed<boolean>(() => {
  return (
    hwStore.hasSTU &&
    hwStore.activeSTH &&
    hwStore.activeHolder &&
    (mStore.acquisitionTime > 0 || mStore.continuous) &&
    mStore.selectedChannels.first > 0
  )
})
</script>

<template>
  <div class="flex flex-row">
    <DefaultLayout class="w-fill w-stretch">
      <TextBlock
        heading="Capture Measurement"
        subheading="Configure measurement settings and capture data."
        :button="false"
      />
      <div class="flex flex-row">
        <div class="flex flex-col flex-grow gap-3">
          <Chart
            ref="chart"
            class="flex flex-col flex-grow"
            :data="chartData"
          />
          <TextBlock
            heading="Calculation Settings"
            :button="false"
            :border="false"
            class="!mb-0 !pb-0"
          />
          <table class="w-fit border-separate border-spacing-y-2">
            <tr>
              <td>
                <h4 class="mr-3">
                  Chart Draw Increment
                </h4>
              </td>
              <td>
                <CustomSlider
                  v-model="drawIncrement"
                  :min="1"
                  :max="100"
                  @slider-change="wrapUpdate"
                />
              </td>
            </tr>
            <tr>
              <td>
                <h4 class="mr-3">
                  IFT Window Width
                </h4>
              </td>
              <td>
                <CustomSlider
                  v-model="windowWidth"
                  :min="50"
                  :max="250"
                  @slider-change="wrapUpdate"
                />
              </td>
            </tr>
          </table>
        </div>
        <div class="flex flex-col flex-grow gap-3">
          <NamedInput title="Devices">
            <InputGroup v-if="hwStore.hasSTU && hwStore.activeSTH">
              <InputGroupAddon class="flex-grow !text-black">
                STU: {{ hwStore.activeSTU?.getName() }}
              </InputGroupAddon>
              <InputGroupAddon class="flex-grow !text-black">
                STH: {{ hwStore.activeSTH?.getName() }}
              </InputGroupAddon>
              <Button
                label="Change"
                icon="pi pi-cog"
                outlined
                @click="router.push('/')"
              />
            </InputGroup>
            <Button
              v-else
              label="Connect to STH"
              severity="danger"
              @click="router.push('/')"
            />
          </NamedInput>
          <NamedInput title="Measure">
<!--            <div class="flex flex-row">
              <ToggleSwitch
                v-model="mStore.continuous"
                input-id="continuous" />
              <label
                for="continuous"
                class="ml-3">Run&nbsp;continuously</label>
            </div>-->
            <InputGroup>
              <InputNumber
                v-model="mStore.acquisitionTime"
                input-id="acqTime"
                :min="0"
                :disabled="mStore.continuous"
              />
              <InputGroupAddon
                class="!text-black"
                :disabled="mStore.continuous"
              >
                s
              </InputGroupAddon>
              <Button
                :label="state === 'open' ? 'Stop Recording' : 'Start Recording'"
                :severity="state === 'open' ? 'danger' : 'primary'"
                class="!px-5"
                :disabled="!canMeasure"
                @click="startStopClickHandler"
              />
            </InputGroup>
          </NamedInput>
          <div class="flex flex-col">
            <NamedInput title="Measurement Channels">
              <InputGroup
                v-for="slot in measurementChannels"
                :key="slot"
              >
                <InputGroupAddon>
                  <Checkbox
                    v-model="mStore.activeChannels[slot]"
                    binary
                    :disabled="slot === 'first'"
                  />
                </InputGroupAddon>
                <InputGroupAddon>
                  <span class="capitalize !text-black inline-block w-24">
                    {{ slot }}
                  </span>
                </InputGroupAddon>
                <Select
                  v-model="mStore.selectedChannels[slot]"
                  :options="hwStore.activeHolder?.sensors ?? []"
                  :option-value="(sens: TAssignedSensor) => sens.channel"
                  :option-label="channelSensorRepr"
                  :disabled="!mStore.activeChannels[slot]"
                  placeholder="Disabled"
                  fluid
                />
              </InputGroup>
            </NamedInput>
          </div>
        </div>
      </div>
      <ADCDrawer />
    </DefaultLayout>
    <button
      class="
        vertical-writing-lr orientation-mixed rotate-180
        bg-gray-200 h-full"
      @click="adcStore.ADCDrawerVisible = true"
    >
      Show ADC Config
    </button>
  </div>
</template>

<style scoped>

</style>