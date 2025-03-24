<script setup lang="ts">
import { getAPILink } from '@/api/icoapi.ts';
import {startMeasurement, stopMeasurement} from '@/api/icoapi.ts';
/* eslint-disable max-len */
import StreamingChart from '@/components/elements/charts/StreamingChart.vue';
import { updateChartData } from '@/components/elements/charts/streamingChartHelper.ts';
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
  useMeasurementStore
} from '@/stores/measurementStore/measurementStore.ts';
import { MeterItem } from '@/utils/dataModels.ts';
import { useMeasurementWebsocket } from '@/utils/useMeasurementWebSocket.ts';
import { ChartData } from 'chart.js';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import MeterGroup from 'primevue/metergroup';
import Select from 'primevue/select';
import Toast from 'primevue/toast';
import {
  computed, onBeforeUnmount,
  ref
} from 'vue';
import { useRouter } from 'vue-router';
import {useLoadingHandler} from '@/utils/useLoadingHandler.ts';
import {useGeneralStore} from '@/stores/generalStore/generalStore.ts';
import ChartStreamControls from '@/components/elements/inputs/ChartStreamControls.vue';
/* eslint-enable max-len */

const chartData = ref<ChartData<'line'>>({
  labels: [],
  datasets: []
})
const router = useRouter()
const hwStore = useHardwareStore()
const mStore = useMeasurementStore()
const gStore = useGeneralStore()
const adcStore = useADCStore()
const {
  open,
  close,
  state,
  storage,
  ift_storage,
  dataloss
} = useMeasurementWebsocket(
  true,
  () => wrapUpdate()
)

function wrapUpdate() {
  updateChartData(
    storage.value,
    chartData,
    mStore.activeChannels,
    mStore.IFTRequested,
    maxNumberOfPoints.value,
    ift_storage,
    {
      first: channelSensorRepr(hwStore.activeHolder?.sensors.find(sens => sens.channel === mStore.selectedChannels.first)) ?? 'First Channel',
      second: channelSensorRepr(hwStore.activeHolder?.sensors.find(sens => sens.channel === mStore.selectedChannels.second)) ?? 'Second Channel',
      third: channelSensorRepr(hwStore.activeHolder?.sensors.find(sens => sens.channel === mStore.selectedChannels.third)) ?? 'Third Channel',
      ift: `IFT Value (${channelSensorRepr(hwStore.activeHolder?.sensors.find(sens => sens.channel === mStore.selectedChannels[mStore.IFTChannel]))})`
    },
    3175,
    mStore.chartMaximumDisplayedTime,
    currentMin,
    currentMax
  )

  if(storage.value.length === 0) { return }

  const streamStartStamp = storage.value[0].timestamp
  const streamEndStamp = storage.value[storage.value.length - 1].timestamp
  const length = streamEndStamp - streamStartStamp

  if(length > mStore.chartMaximumDisplayedTime) {
    mStore.updateChartStartTime(streamEndStamp - 10)
    mStore.updateChartEndTime(streamEndStamp)
  } else {
    mStore.updateChartStartTime(streamStartStamp)
    mStore.updateChartEndTime(streamStartStamp + 10)
  }


  if(currentMin.value) {
    mStore.updateChartYMin(currentMin.value)
  }
  if(currentMax.value) {
    mStore.updateChartYMax(currentMax.value)
  }
}

const currentMin = ref<number | undefined>(undefined)
const currentMax = ref<number | undefined>(undefined)

// eslint-disable-next-line max-len
const { loading: startLoading, call: start } = useLoadingHandler(async () => {
  await startMeasurement({
    name: null,
    first: mStore.activeChannels.first
        ?  mStore.selectedChannels.first : 0,
    second: mStore.activeChannels.second
        ?  mStore.selectedChannels.second : 0,
    third: mStore.activeChannels.third
        ?  mStore.selectedChannels.third : 0,
    mac: hwStore.activeSTH?.getMacAddress(),
    time: mStore.continuous ? null : mStore.acquisitionTime,
    ift_requested: mStore.IFTRequested,
    ift_channel: mStore.IFTChannel,
    ift_window_width: mStore.windowWidth,
    adc: adcStore.values
  })
  await gStore.systemState.checkState()
})

const { loading: stopLoading, call: stop } = useLoadingHandler(async () => {
  await stopMeasurement()
  close()
  await gStore.systemState.checkState()
})

function channelSensorRepr(assignedSensor?: TAssignedSensor): string {
  if (!assignedSensor) return ''
  return `[${assignedSensor.channel}] ${assignedSensor.sensor.name}`
}

// Maximum drawable points per channel for graph
const maxNumberOfPoints = ref<number>(2000)

const datalossMeter = computed<MeterItem[]>(() => [
  {
    label: 'OK',
    value: 100 - ((dataloss.value ?? 0) * 100),
    color: 'green',
    icon: ''
  },
  {
    label: 'Lost',
    value: (dataloss.value ?? 0) * 100,
    color: 'red',
    icon: ''
  },
])

onBeforeUnmount(() => window.setTimeout(close, 0))
</script>

<template>
  <div class="flex flex-row h-full">
    <DefaultLayout class="w-fill w-stretch">
      <TextBlock
        v-if="hwStore.hasSTU && hwStore.activeSTH"
        heading="Measure "
        subheading="Capture a measurement from the connected tool"
        :button="false" />
      <div
        v-if="hwStore.hasSTU && hwStore.activeSTH"
        class="flex flex-row"
      >
        <StreamingChart
          class="flex flex-col flex-grow"
          :data="chartData"
          :boundaries="{
            xmin: mStore.chartStartTime,
            xmax: mStore.chartEndTime,
            ymin: mStore.chartYMin,
            ymax: mStore.chartYMax
          }"
        />
        <div class="flex flex-col flex-grow gap-3">
          <NamedInput title="Devices">
            <InputGroup>
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
          </NamedInput>
          <ChartStreamControls
            :state="state"
            :start-loading="startLoading"
            :stop-loading="stopLoading"
            @start="start"
            @stop="stop"
            @show="() => {
              mStore.resetChartBounds();
              open()
            }"
            @hide="close"
          />
          <div class="flex flex-col">
            <NamedInput title="Measurement Channels">
              <InputGroup
                v-for="slot in measurementChannels"
                :key="slot"
              >
                <InputGroupAddon class="w-12">
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
          <NamedInput title="IFT Value">
            <InputGroup>
              <InputGroupAddon class="w-12">
                <Checkbox
                  v-model="mStore.IFTRequested"
                  binary
                />
              </InputGroupAddon>
              <InputGroupAddon>
                <span class="capitalize !text-black inline-block w-24">
                  IFT Channel
                </span>
              </InputGroupAddon>
              <Select
                v-model="mStore.IFTChannel"
                :options="['first', 'second', 'third']"
                :disabled="!hwStore.activeHolder"
                placeholder="Disabled"
                fluid
              />
            </InputGroup>
            <InputGroup>
              <CustomSlider
                v-model="mStore.windowWidth"
                class="w-full"
                title="Window Width"
                :min="50"
                :max="250"
              />
            </InputGroup>
          </NamedInput>
          <NamedInput title="Measurement Integrity (Packet Loss)">
            <InputGroup>
              <MeterGroup :value="datalossMeter" class="w-full">
                <template #label="{ value }">
                  <div class="flex flex-wrap gap-3 items-center">
                    <template
                      v-for="val in value"
                      :key="val.label"
                    >
                      <span
                        :data-color="val.color"
                        class="w-4 h-4 rounded-full"
                        :style="`background-color: ${val.color}`"
                      ></span>
                      <span>{{ val.label }} ({{ val.value.toFixed(2) }}%)</span>
                    </template>
                  </div>
                </template>
              </MeterGroup>
            </InputGroup>
          </NamedInput>
        </div>
      </div>
      <div
        v-else
        class="text-center h-stretch flex justify-center w-full"
      >
        <div class="flex flex-col gap-4 w-fit mt-[20%]">
          <h2 class="text-lg">
            Nothing to Measure
          </h2>
          <h4>
            There is no running stream. Connect a device to start measuring.
          </h4>
          <Button
            label="Connect a Device"
            severity="primary"
            outlined
            @click="router.push('/')"
          />
        </div>
      </div>
      <ADCDrawer />
    </DefaultLayout>
    <button
      v-if="hwStore.activeSTH"
      class="
        vertical-writing-lr orientation-mixed rotate-180
        bg-gray-200 [height:calc(100%-39px)]"
      @click="adcStore.ADCDrawerVisible = true"
    >
      Show ADC Config
    </button>
    <Toast group="newfile">
      <template #message>
        <div>
          <h4 class="text-lg">
            File saved
          </h4>
          <h5 class="mb-3">
            Your file has been saved successfully. Visit the <router-link class="underline" to="/files">Files page</router-link> or download it here:
          </h5>
          <Button
            as="a"
            style="padding-left: 0;"
            link
            :href="`${getAPILink()}/files/${mStore.getLatestFileName}`">
            {{ mStore.getLatestFileName }}
            <i class="pi pi-download" />
          </Button>
        </div>
      </template>
    </Toast>
  </div>
</template>

<style scoped>

</style>