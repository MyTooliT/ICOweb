<script setup lang="ts">
import {sendMeasurementStopFlag, sendPostMetaOverride} from '@/api/icoapi.ts';
import { startMeasurement } from '@/api/icoapi.ts';
/* eslint-disable max-len */
import StreamingChart from '@/components/charts/StreamingChart.vue';
import { updateChartData } from '@/components/charts/streamingChartHelper.ts';
import ADCDrawer from '@/components/misc/ADCDrawer.vue';
import ContentCard from '@/components/misc/ContentCard.vue';
import DefaultLayout from '@base/layout/DefaultLayout.vue';
import { useADCStore } from '@/stores/ADCStore/ADCStore.ts';
import { TAssignedSensor } from '@/stores/hardwareStore/classes/HolderConfig.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import {
  measurementChannels, useMeasurementStore
} from '@/stores/measurementStore/measurementStore.ts';
import { useMeasurementWebsocket } from '@/utils/useMeasurementWebSocket.ts';
import { ChartData } from 'chart.js';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import {
  computed, onBeforeUnmount, onMounted, ref, watch
} from 'vue';
import { useRouter } from 'vue-router';
import {useLoadingHandler} from '@/utils/useLoadingHandler.ts';
import {useGeneralStore} from '@/stores/generalStore/generalStore.ts';
import ChartStreamControls from '@/components/inputs/ChartStreamControls.vue';
import {useDisable} from '@/utils/useDisable.ts';
import PreMetaData from '@/components/forms/PreMetaData.vue';
import PostMetaModal from '@/components/modals/PostMetaModal.vue';
import {useYamlConfig} from '@/utils/useYamlConfig.ts';
import {Sensor, SensorType} from '@/stores/hardwareStore/classes/Sensor.ts';
import {ActiveChannels} from '@/stores/measurementStore/measurementStore.ts';
import {MeasurementStatus} from '@/client';
import {format} from 'date-fns';
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

/*
 * Several people can use the same device at the same time (e.g. remotely).
 * The API is the source of truth for the connected sensor device and for a
 * running measurement, so everything about them comes from the system state,
 * not from the settings stored in this browser. This also works for a
 * measurement another client started.
 */
type TSlot = typeof measurementChannels[number]
type TSlotSensor = { channel?: number, sensor: Sensor }

const running = computed<boolean>(() => gStore.systemState.running)
const runningStatus = computed<MeasurementStatus | null>(() =>
  gStore.systemState.running ? gStore.systemState.measurementStatus : null
)
const runningInstructions = computed(() => runningStatus.value?.instructions ?? null)

// Sensor device the API is connected to
const connectedSTH = computed(() => gStore.systemState.sthConnected)
const hasDevice = computed<boolean>(() => running.value || connectedSTH.value !== null)

// Holder configuration chosen for the sensor device in this browser, or the
// default one (e.g. in a browser that never listed the sensor devices)
const holder = computed(() =>
  hwStore.activeHolder ?? hwStore.getHolder(hwStore.defaultHolderID)
)

// Channels of the running measurement, otherwise the local selection
const slots = computed<Record<TSlot, { active: boolean, sensorId: string | null }>>(() => {
  const instructions = runningInstructions.value
  const result = {} as Record<TSlot, { active: boolean, sensorId: string | null }>
  measurementChannels.forEach(slot => {
    if(instructions) {
      const sensorId = instructions[slot]?.sensor_id ?? null
      result[slot] = { active: sensorId !== null, sensorId }
    } else {
      result[slot] = {
        active: mStore.activeChannels[slot],
        sensorId: mStore.selectedChannels[slot]
      }
    }
  })
  return result
})
const activeSlots = computed<ActiveChannels>(() => ({
  first: slots.value.first.active,
  second: slots.value.second.active,
  third: slots.value.third.active
}))
const iftRequested = computed<boolean>(() =>
  runningInstructions.value ? runningInstructions.value.ift_requested : mStore.IFTRequested
)
const iftChannel = computed<TSlot>(() => {
  const channel = runningInstructions.value?.ift_channel
  return (measurementChannels as readonly string[]).includes(channel ?? '')
    ? channel as TSlot
    : mStore.IFTChannel
})

function findSensor(sensorId: string | null | undefined): TSlotSensor | undefined {
  if(!sensorId) return undefined
  const assigned = holder.value?.sensors.find(sens => sens.sensor.sensor_id === sensorId)
  if(assigned) return assigned
  const sensor = hwStore.sensorList.find(sens => sens.sensor_id === sensorId)
  return sensor ? { sensor } : undefined
}

function sensorRepr(slotSensor?: TSlotSensor): string {
  if(!slotSensor) return ''
  return slotSensor.channel === undefined
    ? slotSensor.sensor.name
    : `[${slotSensor.channel}] ${slotSensor.sensor.name}`
}

function slotRepr(slot: TSlot): string {
  return sensorRepr(findSensor(slots.value[slot].sensorId))
}

function wrapUpdate() {
  updateChartData(
    storage.value,
    chartData,
    activeSlots.value,
    iftRequested.value,
    maxNumberOfPoints.value,
    ift_storage,
    {
      first: slotRepr('first') || 'First Channel',
      second: slotRepr('second') || 'Second Channel',
      third: slotRepr('third') || 'Third Channel',
      ift: `IFT Value (${slotRepr(iftChannel.value)})`
    },
    channelUnits.value,
    3175,
    mStore.chartMaximumDisplayedTime,
    chartYMinPerUnit,
    chartYMaxPerUnit
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
  if(scales.value) {
    Object.keys(scales.value).forEach(key => {
      // @ts-ignore
      scales.value[key].min = chartYMinPerUnit.value[key]
      // @ts-ignore
      scales.value[key].max = chartYMaxPerUnit.value[key]
    })
  }
}
const chartYMinPerUnit = ref<{[key: string] : number}>({})
const chartYMaxPerUnit = ref<{[key: string] : number}>({})
const channelUnits = computed(() => {
  return {
    first: findSensor(slots.value.first.sensorId)?.sensor.sensorType.physicalUnit ?? '',
    second: findSensor(slots.value.second.sensorId)?.sensor.sensorType.physicalUnit ?? '',
    third: findSensor(slots.value.third.sensorId)?.sensor.sensorType.physicalUnit ?? '',
  }
})
const config = useYamlConfig()

const hasPostMeta = computed<boolean>(() => {
  if(!metaEnabled.value) return false
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
  const waitForPostMeta = metaEnabled.value && hasPostMeta.value
  const response = await startMeasurement({
    name: metaEnabled.value ? assembledFilename.value : null,
    first: {
      sensor_id: mStore.activeChannels.first ? mStore.selectedChannels.first : null
    },
    second: {
      sensor_id: mStore.activeChannels.second ? mStore.selectedChannels.second : null
    },
    third: {
      sensor_id: mStore.activeChannels.third ? mStore.selectedChannels.third : null
    },
    mac_address: hwStore.activeSTH?.getMacAddress() ?? connectedSTH.value?.mac_address,
    time: mStore.continuous ? null : mStore.acquisitionTime,
    ift_requested: mStore.IFTRequested,
    ift_channel: mStore.IFTChannel,
    ift_window_width: mStore.windowWidth,
    adc: adcStore.values,
    meta: metaEnabled.value ? mStore.preMetaForm : null,
    wait_for_post_meta: waitForPostMeta,
    disconnect_after_measurement: mStore.disconnectAfterMeasurement
  })
  // The measurement file only exists on the server; remember its name to be
  // able to add post-meta once the measurement has stopped
  mStore.lastMeasurementFile = response.data.name ? `${response.data.name}.hdf5` : null
  mStore.postMetaPending = waitForPostMeta && mStore.lastMeasurementFile !== null
  //scales.value = computeScales()
  if(mStore.autostream) {
    show()
    chartYMinPerUnit.value = {}
    chartYMaxPerUnit.value = {}
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
  if(!mStore.lastMeasurementFile) {
    throw new Error('Name of measurement file is unknown')
  }
  // On failure the error is shown by the API layer and the dialog stays open
  await sendPostMetaOverride(mStore.lastMeasurementFile, mStore.postMetaForm)
  mStore.postMetaPending = false
  gStore.postMetaModalVisible = false
  await afterMeasurementCleanup()
}

// The API only reports the measurement as stopped after the measurement file
// was closed, so post-meta can be added right away. A closed WebSocket also
// resets `running`, which does not mean that the measurement has stopped.
watch(() => gStore.systemState.running, (running, wasRunning) => {
  if(wasRunning && !running && gStore.systemState.reachable && mStore.postMetaPending) {
    gStore.postMetaModalVisible = true
  }
})

const show = () => {
  // Already open or opening (e.g. started here and pushed as running)
  if(state.value !== 'closed') return
  mStore.resetChartBounds();
  open()
}

// Show the data of a measurement that someone else started, or that was
// already running when this page was opened
watch(running, (isRunning) => {
  if(isRunning && mStore.autostream) show()
})

function channelSensorRepr(assignedSensor?: TAssignedSensor): string {
  return sensorRepr(assignedSensor)
}

// Running time of the measurement, updated every second. The API reports the
// start time with UTC offset, so this is also correct in other time zones.
const now = ref<number>(Date.now())
let clock: number | undefined = undefined

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return hours > 0 ? `${hours}:${mmss}` : mmss
}

const startTime = computed<Date | null>(() => {
  const start = runningStatus.value?.start_time
  return start ? new Date(start) : null
})
const elapsed = computed<string | null>(() => {
  if(!startTime.value) return null
  return formatDuration(Math.max(0, Math.floor((now.value - startTime.value.getTime()) / 1000)))
})
const duration = computed<string>(() => {
  const time = runningInstructions.value?.time
  return time ? formatDuration(time) : 'Until stopped'
})
const runningChannels = computed(() =>
  measurementChannels
    .filter(slot => slots.value[slot].active)
    .map(slot => slotRepr(slot) || slots.value[slot].sensorId || slot)
)
const supplyVoltage = computed<string>(() => {
  if(running.value) {
    const voltage = runningStatus.value?.start_supply_voltage
    return voltage === null || voltage === undefined
      ? 'N/A'
      : `${voltage.toFixed(2)}V (at start)`
  }
  return hwStore.activeSTH?.getSupplyVoltageRepr() ?? 'N/A'
})

// Maximum drawable points per channel for the graph
const maxNumberOfPoints = ref<number>(1000)

// Share of lost packets in percent (null before any data was received)
const lostPercent = computed<number | null>(() =>
  dataloss.value === null || dataloss.value === undefined
    ? null
    : dataloss.value * 100
)

// Status of the measurement for the header of the chart
const statusTag = computed(() => {
  if(gStore.systemState.running) {
    return state.value === 'open'
      ? { label: 'Recording · live', severity: 'success' }
      : { label: 'Recording', severity: 'success' }
  }
  return canMeasure.value
    ? { label: 'Ready', severity: 'info' }
    : { label: 'Not ready', severity: 'warn' }
})

// Disables measuring if not all requirements are met
const canMeasure = computed<boolean>(() => {
  return (
      hwStore.hasSTU &&
      connectedSTH.value !== null &&
      holder.value !== undefined &&
      (mStore.acquisitionTime > 0 || mStore.continuous) &&
      mStore.selectedChannels.first !== null &&
      (metaEnabled.value ? mStore.preMetaValid : true)
  )
})

const scales = ref<Record<string, Chart.ChartYAxe>>(computeScales())

function computeScales(): Record<string, Chart.ChartYAxe> {
  const scl: Record<string, Chart.ChartYAxe> = {}
  const sensorsForChannels = measurementChannels
    .filter(slot => slots.value[slot].active)
    .map(slot => findSensor(slots.value[slot].sensorId))
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
      },
      min: chartYMinPerUnit.value[udc.physicalUnit] ?? -10,
      max: chartYMaxPerUnit.value[udc.physicalUnit] ?? 10,
    }
  })
  return scl
}

const metaEnabled = ref<boolean>(false)

onMounted(async () => {
  clock = window.setInterval(() => now.value = Date.now(), 1000)
  if(running.value && mStore.autostream) show()
  await hwStore.refetchSensorsAndHolders()
  const currentHolder = holder.value
  if(currentHolder) {
    if(currentHolder.sensors.length < Object.values(mStore.activeChannels).filter(channel => channel).length) {
      mStore.activeChannels = {
        first: true,
        second: false,
        third: false
      }
      mStore.selectedChannels = {
        first: currentHolder.sensors[0].sensor.sensor_id,
        second: null,
        third: null
      }
    }
  }
  metaEnabled.value = await useYamlConfig().isEnabled()
  scales.value = computeScales()
})
// Channels or sensors change with the local selection, when a measurement
// starts or stops, and once the sensors are loaded
watch([slots, holder, () => hwStore.sensorList.length], () => scales.value = computeScales())
onBeforeUnmount(() => {
  if(clock !== undefined) window.clearInterval(clock)
  window.setTimeout(close, 0)
})
</script>

<template>
  <div class="flex flex-row">
    <PostMetaModal
      :loading="postMetaLoading"
      @send="submitPostMeta"
      @canceled="submitPostMeta"
    />
    <DefaultLayout class="grow min-w-0">
      <div
        v-if="hasDevice"
        class="flex flex-col lg:flex-row gap-3 items-start"
      >
        <div class="flex flex-col gap-3 grow min-w-0 w-full">
          <ContentCard
            title="Measurement"
            subtitle="Capture a measurement from the connected sensor device."
          >
            <template #title>
              <Tag
                :value="statusTag.label"
                :severity="statusTag.severity"
              />
            </template>
            <StreamingChart
              class="h-[clamp(320px,calc(100dvh-200px),1000px)]"
              :data="chartData"
              :boundaries="{
                xmin: mStore.chartStartTime,
                xmax: mStore.chartEndTime,
                ymin: mStore.chartYMin,
                ymax: mStore.chartYMax
              }"
              :scales="scales"
            />
          </ContentCard>
          <ContentCard
            v-if="metaEnabled"
            title="Metadata"
            collapsible
            collapsed
          >
            <template #title>
              <Tag
                v-if="mStore.preMetaValid"
                value="Complete"
                icon="pi pi-check"
                severity="success"
              />
              <Tag
                v-else
                value="Incomplete"
                icon="pi pi-exclamation-triangle"
                severity="danger"
              />
            </template>
            <PreMetaData
              phase="pre"
              :disabled="gStore.systemState.running"
            />
          </ContentCard>
        </div>
        <aside class="flex flex-col gap-3 w-full lg:w-[24rem] shrink-0">
          <ContentCard title="Devices">
            <template #actions>
              <Button
                v-tooltip.left="'Manage devices'"
                icon="pi pi-cog"
                size="small"
                text
                rounded
                aria-label="Manage devices"
                :disabled="gStore.systemState.running"
                @click="router.push('/')"
              />
            </template>
            <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt class="ico-muted">STU</dt>
              <dd class="text-right">{{ hwStore.activeSTU?.getName() ?? '–' }}</dd>
              <dt class="ico-muted">STH</dt>
              <dd class="text-right">
                {{ connectedSTH?.name ?? runningStatus?.tool_name ?? '–' }}
              </dd>
              <template v-if="connectedSTH">
                <dt class="ico-muted">MAC</dt>
                <dd class="text-right font-mono">{{ connectedSTH.mac_address }}</dd>
              </template>
              <dt class="ico-muted">Supply voltage</dt>
              <dd class="text-right">{{ supplyVoltage }}</dd>
            </dl>
          </ContentCard>
          <ContentCard :title="running ? 'Running Measurement' : 'Control'">
            <dl
              v-if="runningStatus"
              class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mb-3"
            >
              <dt class="ico-muted">File</dt>
              <dd class="text-right font-mono [overflow-wrap:anywhere]">
                {{ runningStatus.name ?? '–' }}
              </dd>
              <dt class="ico-muted">Started</dt>
              <dd class="text-right">
                {{ startTime ? format(startTime, 'HH:mm:ss') : '–' }}
              </dd>
              <dt class="ico-muted">Elapsed</dt>
              <dd class="text-right font-mono">{{ elapsed ?? '–' }}</dd>
              <dt class="ico-muted">Duration</dt>
              <dd class="text-right">{{ duration }}</dd>
              <dt class="ico-muted">Channels</dt>
              <dd class="text-right">
                <div
                  v-for="channel in runningChannels"
                  :key="channel"
                >
                  {{ channel }}
                </div>
              </dd>
              <template v-if="iftRequested">
                <dt class="ico-muted">IFT</dt>
                <dd class="text-right">{{ slotRepr(iftChannel) || iftChannel }}</dd>
              </template>
            </dl>
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
          </ContentCard>
          <ContentCard
            v-if="!running"
            title="Channels"
          >
            <div class="flex flex-col gap-2">
              <InputGroup
                v-for="slot in measurementChannels.slice(0, holder?.sensors.length ?? 2)"
                :key="slot"
              >
                <InputGroupAddon class="w-12">
                  <Checkbox
                    v-model="mStore.activeChannels[slot]"
                    binary
                    :aria-label="`Use ${slot} channel`"
                    :disabled="slot === 'first'"
                  />
                </InputGroupAddon>
                <Select
                  v-model="mStore.selectedChannels[slot]"
                  :options="holder?.sensors ?? []"
                  :option-value="(sens: TAssignedSensor) => sens.sensor.sensor_id"
                  :option-label="channelSensorRepr"
                  :disabled="!mStore.activeChannels[slot] || gStore.systemState.running"
                  placeholder="No Selection"
                />
              </InputGroup>
            </div>
          </ContentCard>
          <ContentCard title="Packet Loss">
            <template #title>
              <Tag
                v-if="lostPercent !== null"
                :value="`${lostPercent.toFixed(2)} % lost`"
                :severity="lostPercent === 0 ? 'success' : lostPercent < 1 ? 'warn' : 'danger'"
              />
            </template>
            <div
              v-if="lostPercent !== null"
              class="h-2 rounded-full overflow-hidden flex flex-row bg-error"
              role="meter"
              aria-label="Received packets"
              :aria-valuenow="Math.round(100 - lostPercent)"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="h-full bg-[var(--p-green-500)]"
                :style="{ width: `${100 - lostPercent}%` }"
              />
            </div>
            <p
              v-else
              class="text-sm ico-muted"
            >
              Shown once data is received.
            </p>
          </ContentCard>
        </aside>
      </div>
      <ContentCard
        v-else
        title="Nothing to Measure"
        class="max-w-md mx-auto mt-[15vh]"
      >
        <p class="text-sm ico-muted mb-3">
          There is no running stream. Connect a sensor device to start
          measuring.
        </p>
        <Button
          label="Connect a Device"
          icon="pi pi-wrench"
          size="small"
          outlined
          @click="router.push('/')"
        />
      </ContentCard>
    </DefaultLayout>
    <ADCDrawer v-if="featureEnabled('ADC')" />
    <button
      v-if="hasDevice && featureEnabled('ADC')"
      class="
        vertical-writing-lr orientation-mixed rotate-180 text-sm px-1
        bg-surface-container hover:bg-surface-container-high border-r ico-divider
        [height:calc(100%-39px)]"
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