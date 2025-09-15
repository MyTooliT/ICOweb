<script setup lang="ts">
import {sendMeasurementPostMeta, sendMeasurementStopFlag} from '@/api/icoapi.ts';
import { startMeasurement } from '@/api/icoapi.ts';
/* eslint-disable max-len */
import StreamingChart from '@/components/elements/charts/StreamingChart.vue';
import { updateChartData } from '@/components/elements/charts/streamingChartHelper.ts';
import NamedInput from '@/components/elements/forms/NamedInput.vue';
import ADCDrawer from '@/components/elements/misc/ADCDrawer.vue';
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import SplitLayout from '@/layouts/SplitLayout.vue';
import { useADCStore } from '@/stores/ADCStore/ADCStore.ts';
import { TAssignedSensor } from '@/stores/hardwareStore/classes/HolderConfig.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import {
  measurementChannels, useMeasurementStore
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
import {Accordion} from 'primevue';
import {AccordionContent} from 'primevue';
import {AccordionPanel} from 'primevue';
import {AccordionHeader} from 'primevue';
import {
  computed, onBeforeUnmount, onMounted, ref, watch
} from 'vue';
import { useRouter } from 'vue-router';
import {useLoadingHandler} from '@/utils/useLoadingHandler.ts';
import {useGeneralStore} from '@/stores/generalStore/generalStore.ts';
import ChartStreamControls from '@/components/elements/inputs/ChartStreamControls.vue';
import {useDisable} from '@/utils/useDisable.ts';
import PreMetaData from '@/components/elements/forms/meta/PreMetaData.vue';
import PostMetaModal from '@/components/elements/modals/PostMetaModal.vue';
import {useYamlConfig} from '@/utils/useYamlConfig.ts';
import {SensorType} from '@/stores/hardwareStore/classes/Sensor.ts';
/* eslint-enable max-len */

const chartData = ref<ChartData<'line'>>({
  labels: [],
  datasets: []
})

const { featureEnabled } = useDisable()
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
  dataloss,
  ws
} = useMeasurementWebsocket(
  true,
  () => wrapUpdate(),
() => gStore.systemState.checkState()
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
    {
      first: hwStore.activeHolder?.sensors.find(sens => sens.channel === mStore.selectedChannels.first)?.sensor.sensorType.physicalUnit ?? 'g',
      second: hwStore.activeHolder?.sensors.find(sens => sens.channel === mStore.selectedChannels.second)?.sensor.sensorType.physicalUnit ?? 'g',
      third: hwStore.activeHolder?.sensors.find(sens => sens.channel === mStore.selectedChannels.third)?.sensor.sensorType.physicalUnit ?? 'g',
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
const config = useYamlConfig()

const hasPostMeta = computed<boolean>(() => {
  if(config.config.value?.profiles) {
    const profiles = Object.values(config.config.value.profiles)
    const profile = profiles.find(p => p.id === mStore.preMetaForm.profile)
    if(profile && profile.post) {
      return true
    }
  }
  return false
})

// eslint-disable-next-line max-len
const { loading: startLoading, call: start } = useLoadingHandler(async () => {
  mStore.resetChartBounds()
  storage.value = []
  ift_storage.value = []
  if(ws) {
    ws.value?.close()
  }
  await config.reload()
  await startMeasurement({
    name: featureEnabled('Meta') ? assembledFilename.value : null,
    first: {
      channel_number: mStore.activeChannels.first ?  mStore.selectedChannels.first : 0,
      sensor_id: mStore.activeChannels.first ? hwStore.activeHolder?.sensors.find(sensor => sensor.channel === mStore.selectedChannels.first)?.sensor.id ?? null : null
    },
    second: {
      channel_number: mStore.activeChannels.second ? mStore.selectedChannels.second : 0,
      sensor_id: mStore.activeChannels.second ? hwStore.activeHolder?.sensors.find(sensor => sensor.channel === mStore.selectedChannels.second)?.sensor.id ?? null : null
    },
    third: {
      channel_number: mStore.activeChannels.third ? mStore.selectedChannels.third : 0,
      sensor_id: mStore.activeChannels.third ? hwStore.activeHolder?.sensors.find(sensor => sensor.channel === mStore.selectedChannels.third)?.sensor.id ?? null : null
    },
    mac_address: hwStore.activeSTH?.getMacAddress(),
    time: mStore.continuous ? null : mStore.acquisitionTime,
    ift_requested: mStore.IFTRequested,
    ift_channel: mStore.IFTChannel,
    ift_window_width: mStore.windowWidth,
    adc: adcStore.values,
    meta: featureEnabled('Meta') ? mStore.preMetaForm : null,
    wait_for_post_meta: featureEnabled('Meta') && hasPostMeta.value,
    disconnect_after_measurement: mStore.disconnectAfterMeasurement
  })
  //scales.value = computeScales()
  if(mStore.autostream) {
    show()
  }
  await gStore.systemState.checkState()
})

const { loading: stopLoading, call: stop } = useLoadingHandler(async () => {
  await sendMeasurementStopFlag()
  if(!hasPostMeta.value) {
    // only clean up if no post meta is required
    await afterMeasurementCleanup()
  }
})

const { loading: postMetaLoading, call: submitPostMeta } = useLoadingHandler(sendPostMeta)

const assembledFilename = computed<string | null>(() => {
  if (!mStore.preMetaForm.profile || mStore.preMetaForm.profile?.length === 0) return null
  let name = mStore.preMetaForm.profile
  if(mStore.preMetaForm.parameters.institution) {
    name += '_' + (mStore.preMetaForm.parameters.institution as string).split(' ').join('')
  }
  if(mStore.preMetaForm.parameters.experiment) {
    name += '_' + (mStore.preMetaForm.parameters.experiment as string).split(' ').join('')
  }
  return name
})


async function afterMeasurementCleanup() {
  await gStore.systemState.checkState()
  /*toast.add({life: 7000, group:'newfile'})*/
  if(mStore.disconnectAfterMeasurement) {
    await router.push('/')
  }
}

async function sendPostMeta() {
  await sendMeasurementPostMeta(mStore.postMetaForm)
  await afterMeasurementCleanup()
}

const show = () => {
  mStore.resetChartBounds();
  open()
}

function channelSensorRepr(assignedSensor?: TAssignedSensor): string {
  if (!assignedSensor) return ''
  return `[${assignedSensor.channel}] ${assignedSensor.sensor.name}`
}

// Maximum drawable points per channel for the graph
const maxNumberOfPoints = ref<number>(1000)

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

// Disables measuring if not all requirements are met
const canMeasure = computed<boolean>(() => {
  return (
      hwStore.hasSTU &&
      hwStore.hasSTH &&
      hwStore.hasHolder &&
      (mStore.acquisitionTime > 0 || mStore.continuous) &&
      mStore.selectedChannels.first > 0 &&
      (featureEnabled('Meta') ? mStore.preMetaValid : true)
  )
})

const scales = ref<Record<string, Chart.ChartYAxe>>(computeScales())

function computeScales(): Record<string, Chart.ChartYAxe> {
  const scl: Record<string, Chart.ChartYAxe> = {}
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const relevantChannelNumbers = Object.entries(mStore.selectedChannels).filter(([channel_key, _]) => {
    return mStore.activeChannels[channel_key as typeof measurementChannels[number]]
  }).map(([_, channel_nr]) => channel_nr)
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const sensorsForChannels = relevantChannelNumbers.map(channelNumber =>
      hwStore.activeHolder?.sensors.find(sensor => sensor.channel === channelNumber)
  )
  const uniqueDimensionChannels: Array<SensorType> = []
  sensorsForChannels.forEach(sensor => {
    if(!sensor) return
    if(!uniqueDimensionChannels.map(udc => udc.physicalDimension).includes(sensor?.sensor.sensorType.physicalDimension)) {
      uniqueDimensionChannels.push(new SensorType(
        sensor?.sensor.sensorType.physicalDimension,
        sensor?.sensor.sensorType.physicalUnit
      ))
    }
  })
  uniqueDimensionChannels.forEach(udc => {
    scl[udc.physicalUnit] = {
      position: 'left',
      type: 'linear',
      //@ts-ignore
      title: {
        display: true,
        text: `${udc.physicalDimension} in ${udc.physicalUnit}`,
      }
    }
  })
  return scl
}

onMounted(async () => {
  await hwStore.refetchSensorsAndHolders()
  if(hwStore.activeHolder) {
    if(hwStore.activeHolder.sensors.length < Object.values(mStore.activeChannels).filter(channel => channel).length) {
      mStore.activeChannels = {
        first: true,
        second: false,
        third: false
      }
      mStore.selectedChannels = {
        first: hwStore.activeHolder.sensors[0].channel,
        second: 0,
        third: 0
      }
    }
  }

})
watch(mStore.selectedChannels, () => scales.value = computeScales())
watch(mStore.activeChannels, () => scales.value = computeScales())
onBeforeUnmount(() => window.setTimeout(close, 0))
</script>

<template>
  <div class="flex flex-row">
    <PostMetaModal
      :closable="true"
      :loading="postMetaLoading"
      @send="submitPostMeta"
    />
    <SplitLayout
      v-if="hwStore.hasSTU && hwStore.activeSTH"
      class="w-stretch"
    >
      <TextBlock
        v-if="hwStore.hasSTU && hwStore.activeSTH"
        heading="Measure "
        subheading="Capture a measurement from the connected tool"
        :button="false" />
      <StreamingChart
        class="flex flex-col flex-grow"
        :data="chartData"
        :boundaries="{
          xmin: mStore.chartStartTime,
          xmax: mStore.chartEndTime,
          ymin: mStore.chartYMin,
          ymax: mStore.chartYMax
        }"
        :scales="scales"
      />
      <template #aside>
        <div class="flex flex-col gap-3">
          <NamedInput title="Devices">
            <InputGroup>
              <InputGroupAddon class="flex-grow !text-black">
                {{ hwStore.activeSTU?.getName() }}
              </InputGroupAddon>
              <InputGroupAddon class="flex-grow !text-black">
                {{ hwStore.activeSTH?.getName() }}
              </InputGroupAddon>
              <Button
                :disabled="gStore.systemState.running"
                label="Change"
                icon="pi pi-cog"
                outlined
                @click="router.push('/')"
              />
            </InputGroup>
          </NamedInput>
          <ChartStreamControls
            :ready="canMeasure"
            :state="state"
            :start-loading="startLoading"
            :stop-loading="stopLoading"
            @start="start"
            @stop="stop"
            @show="show"
            @hide="close"
          />
          <div class="flex flex-col">
            <NamedInput title="Measurement Channels">
              <InputGroup
                v-for="slot in measurementChannels.slice(0, hwStore.activeHolder?.sensors.length ?? 2)"
                :key="slot"
              >
                <InputGroupAddon class="w-12">
                  <Checkbox
                    v-model="mStore.activeChannels[slot]"
                    binary
                    :disabled="slot === 'first'"
                  />
                </InputGroupAddon>
                <Select
                  v-model="mStore.selectedChannels[slot]"
                  :options="hwStore.activeHolder?.sensors ?? []"
                  :option-value="(sens: TAssignedSensor) => sens.channel"
                  :option-label="channelSensorRepr"
                  :disabled="!mStore.activeChannels[slot] || gStore.systemState.running"
                  placeholder="No Selection"
                  class=""
                />
              </InputGroup>
            </NamedInput>
          </div>
          <NamedInput title="Measurement Integrity (Packet Loss)">
            <InputGroup>
              <MeterGroup
                :value="datalossMeter"
                class="w-full">
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
                      />
                      <span>{{ val.label }} ({{ val.value.toFixed(2) }}%)</span>
                    </template>
                  </div>
                </template>
              </MeterGroup>
            </InputGroup>
          </NamedInput>
          <div class="[min-width:36ch]" />
        </div>
      </template>
      <template #bottom>
        <Accordion
          v-if="featureEnabled('Meta')"
          class="border rounded-md mt-3"
        >
          <AccordionPanel value="0">
            <AccordionHeader>
              Metadata
              <span
                v-if="mStore.preMetaValid"
                class="pi pi-check text-primary ml-3 mr-auto"
              />
              <span
                v-else
                class="pi pi-exclamation-triangle text-red-500 ml-3 mr-auto"
              />
            </AccordionHeader>
            <AccordionContent>
              <PreMetaData
                phase="pre"
                :disabled="gStore.systemState.running"
              />
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      </template>
    </SplitLayout>
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
    <ADCDrawer v-if="featureEnabled('ADC')" />
    <button
      v-if="hwStore.activeSTH && featureEnabled('ADC')"
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
            Your file has been saved successfully. Visit the <router-link
              class="underline"
              to="/files">
              Files page
            </router-link> to download it.
          </h5>
        </div>
      </template>
    </Toast>
  </div>
</template>

<style scoped>

</style>