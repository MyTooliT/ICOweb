<script setup lang="ts">
import {
  getPreflight,
  sendMeasurementStopFlag,
  sendPostMetaOverride,
  startMeasurement
} from '@/api/icoapi.ts';
/* eslint-disable max-len */
import LiveChart, { LiveChannel } from '@/components/measure/LiveChart.vue';
import MeasureChannelsCard from '@/components/measure/MeasureChannelsCard.vue';
import MeasureControlCard from '@/components/measure/MeasureControlCard.vue';
import MeasureDevicesCard from '@/components/measure/MeasureDevicesCard.vue';
import PacketLossCard from '@/components/measure/PacketLossCard.vue';
import PreflightCard from '@/components/measure/PreflightCard.vue';
import ADCDrawer from '@/components/misc/ADCDrawer.vue';
import ContentCard from '@/components/misc/ContentCard.vue';
import DefaultLayout from '@base/layout/DefaultLayout.vue';
import { useADCStore } from '@/stores/ADCStore/ADCStore.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import {
  measurementChannels, useMeasurementStore
} from '@/stores/measurementStore/measurementStore.ts';
import { DEFAULT_SOURCE, useMeasurementWebsocket } from '@/utils/useMeasurementWebSocket.ts';
import { unitOfSource } from '@/utils/measureSlots.ts';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import {
  computed, onBeforeUnmount, onMounted, ref, watch
} from 'vue';
import { useRouter } from 'vue-router';
import {useLoadingHandler} from '@/utils/useLoadingHandler.ts';
import {useGeneralStore} from '@/stores/generalStore/generalStore.ts';
import {useDisable} from '@/utils/useDisable.ts';
import PreMetaData from '@/components/forms/PreMetaData.vue';
import PostMetaModal from '@/components/modals/PostMetaModal.vue';
import {useYamlConfig} from '@/utils/useYamlConfig.ts';
import {PreflightResponse} from '@/client';
import {useMeasureSlots} from '@/utils/useMeasureSlots.ts';
/* eslint-enable max-len */

const { featureEnabled } = useDisable()
const router = useRouter()
const hwStore = useHardwareStore()
const mStore = useMeasurementStore()
const gStore = useGeneralStore()
const adcStore = useADCStore()

// Samples per second of the default ADC settings. Used to size the chart.
const SAMPLE_RATE = 3175
// The chart shows at most this many frames per source (a margin on top of
// what is drawn), older frames are dropped. See `useMeasurementWebsocket`.
const bufferedFrames = () => Math.ceil(
  liveSampleRate.value * mStore.chartMaximumDisplayedTime * 1.5
)
// With several units ICOapi sends a limited number of points per second and
// unit (setting of the page), in a limited number of messages per second.
// A single unit sends all points.
const liveLimited = computed<boolean>(() =>
  (gStore.systemState.units?.length ?? 0) > 1)
const liveSampleRate = computed<number>(() =>
  liveLimited.value && mStore.liveRate > 0
    ? Math.min(mStore.liveRate, SAMPLE_RATE)
    : SAMPLE_RATE
)
// Every chart is drawn at most this often (milliseconds), not for every
// message.
const drawInterval = computed<number>(() =>
  liveLimited.value && mStore.liveUpdates > 0
    ? Math.max(16, 1000 / mStore.liveUpdates)
    : 50
)

const {
  open,
  close,
  clear,
  state,
  storages,
  sources,
  ift_storage,
  datalossBySource,
  ws
} = useMeasurementWebsocket(
  true,
  () => wrapUpdate(),
  () => gStore.systemState.checkState(),
  bufferedFrames,
  () => liveLimited.value
    ? { rate: mStore.liveRate, updates: mStore.liveUpdates }
    : {}
)

const {
  running, runningStatus, units, multiUnit, connectedSTH, hasDevice, holder,
  holderOf, selectedFor, activeFor, slotsFor, findSensor, slotRepr, iftRequested, iftChannel,
  ensureUnitChannels
} = useMeasureSlots()

/*
 * What is shown in the charts: one chart per source (the data of one unit).
 * Without multi STU support there is one source, and its frames have no name.
 */
const lastUnitOfSource = ref<Record<string, string>>({})
watch(() => runningStatus.value?.units, (measuring) => {
  if(measuring && measuring.length > 0) lastUnitOfSource.value = unitOfSource(measuring)
}, { immediate: true })

const chartSources = computed<string[]>(() => {
  if(!multiUnit.value) return [DEFAULT_SOURCE]
  const names = [
    ...(runningStatus.value?.units ?? []).map(unit => unit.source),
    ...sources.value
  ]
  return [...new Set(names)]
})

function unitOfChartSource(source: string): string | null {
  return multiUnit.value ? (lastUnitOfSource.value[source] ?? null) : null
}

function channelsOf(source: string): LiveChannel[] {
  const unit = unitOfChartSource(source)
  const slots = slotsFor(unit)
  return measurementChannels
    .filter(slot => slots[slot].active)
    .map(slot => {
      const sensor = findSensor(slots[slot].sensorId, unit)?.sensor
      return {
        slot,
        label: slotRepr(slot, unit) || `${slot[0].toUpperCase()}${slot.slice(1)} Channel`,
        unit: sensor?.sensorType.physicalUnit ?? '',
        dimension: sensor?.sensorType.physicalDimension ?? ''
      }
    })
}

function titleOf(source: string): string {
  const unit = unitOfChartSource(source)
  return unit ? `${source} (${unit})` : source
}

const chartVersion = ref<number>(0)
const chartReset = ref<number>(0)
let lastDraw = 0

function wrapUpdate() {
  // The page is asked to update far more often than needed
  const now = performance.now()
  if(now - lastDraw < drawInterval.value) return
  lastDraw = now
  chartVersion.value++

  // All charts show the same window of time
  let streamStartStamp: number | undefined = undefined
  let streamEndStamp: number | undefined = undefined
  Object.values(storages.value).forEach(frames => {
    if(frames.length === 0) return
    const first = frames[0].timestamp
    const last = frames[frames.length - 1].timestamp
    streamStartStamp = Math.min(streamStartStamp ?? first, first)
    streamEndStamp = Math.max(streamEndStamp ?? last, last)
  })
  if(streamStartStamp === undefined || streamEndStamp === undefined) { return }

  if(streamEndStamp - streamStartStamp > mStore.chartMaximumDisplayedTime) {
    mStore.updateChartStartTime(streamEndStamp - 10)
    mStore.updateChartEndTime(streamEndStamp)
  } else {
    mStore.updateChartStartTime(streamStartStamp)
    mStore.updateChartEndTime(streamStartStamp + 10)
  }
}

// Maximum drawable points per channel for the graph
const maxNumberOfPoints = ref<number>(1000)

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

/*
 * Preflight check of all units (multi STU support): A measurement only starts
 * if every unit is ready. The check does not change anything.
 */
const preflight = ref<PreflightResponse | null>(null)
const preflightError = ref<string | null>(null)
const { loading: preflightLoading, call: checkUnits } = useLoadingHandler(async () => {
  try {
    preflight.value = await getPreflight()
    preflightError.value = null
  } catch(e: any) {
    preflight.value = null
    preflightError.value = e?.message || 'The check of the units failed.'
  }
})

/** The channels of one unit (the same instructions as for a single unit) */
function channelInstructions(unit: string | null) {
  const selected = selectedFor(unit)
  const active = activeFor(unit)
  return {
    first: { sensor_id: active.first ? selected.first : null },
    second: { sensor_id: active.second ? selected.second : null },
    third: { sensor_id: active.third ? selected.third : null }
  }
}

// eslint-disable-next-line max-len
const { loading: startLoading, call: start } = useLoadingHandler(async () => {
  if(multiUnit.value) {
    // Nothing is started (or changed) if a unit is not ready
    await checkUnits()
    if(!preflight.value?.ready) {
      throw new Error(preflightError.value
        ?? 'The measurement was not started: not all units are ready.')
    }
  }
  mStore.resetChartBounds()
  clear()
  chartReset.value++
  if(ws) {
    ws.value?.close()
  }
  await config.reload()
  const waitForPostMeta = metaEnabled.value && hasPostMeta.value
  const unitList = multiUnit.value ? (units.value ?? []) : []
  let response
  try {
    response = await startMeasurement({
      name: metaEnabled.value ? assembledFilename.value : null,
      ...channelInstructions(unitList[0]?.unit ?? null),
      // Every unit has its own sensors: its holder may differ
      units: multiUnit.value
        ? Object.fromEntries(unitList.map(unit => [unit.unit, {
          ...channelInstructions(unit.unit),
          mac_address: unit.sth_connected?.mac_address
        }]))
        : undefined,
      mac_address: (multiUnit.value
        ? unitList[0]?.sth_connected?.mac_address
        : hwStore.activeSTH?.getMacAddress() ?? connectedSTH.value?.mac_address
      ) ?? '',
      time: mStore.continuous ? null : mStore.acquisitionTime,
      // IFT is only available with one unit
      ift_requested: unitList.length > 1 ? false : mStore.IFTRequested,
      ift_channel: mStore.IFTChannel,
      ift_window_width: mStore.windowWidth,
      adc: adcStore.values,
      meta: metaEnabled.value ? mStore.preMetaForm : null,
      wait_for_post_meta: waitForPostMeta,
      disconnect_after_measurement: mStore.disconnectAfterMeasurement
    })
  } catch(e) {
    // The start checks the units again: show what it found
    if(multiUnit.value) await checkUnits()
    throw e
  }
  // The measurement file only exists on the server; remember its name to be
  // able to add post-meta once the measurement has stopped
  mStore.lastMeasurementFile = response.data.name ? `${response.data.name}.hdf5` : null
  mStore.postMetaPending = waitForPostMeta && mStore.lastMeasurementFile !== null
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
  chartReset.value++
  open()
}

// Show the data of a measurement that someone else started, or that was
// already running when this page was opened
watch(running, (isRunning) => {
  if(isRunning && mStore.autostream) show()
})

// Disables measuring if not all requirements are met
const unitsReady = computed<boolean>(() => {
  if(!multiUnit.value) {
    return hwStore.hasSTU &&
      connectedSTH.value !== null &&
      holder.value !== undefined &&
      mStore.selectedChannels.first !== null
  }
  const all = units.value ?? []
  return all.length > 0 && all.every(unit =>
    unit.stu_connected &&
    unit.sth_connected &&
    holderOf(unit.unit) !== undefined &&
    selectedFor(unit.unit).first !== null
  ) && preflight.value?.ready !== false
})
const canMeasure = computed<boolean>(() => {
  return (
      unitsReady.value &&
      (mStore.acquisitionTime > 0 || mStore.continuous) &&
      (metaEnabled.value ? mStore.preMetaValid : true)
  )
})

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

const metaEnabled = ref<boolean>(false)

// Check the units again when the connected devices change
const unitsKey = computed(() => (units.value ?? [])
  .map(unit => `${unit.unit}|${unit.stu_connected}|${unit.sth_connected?.mac_address}`)
  .join(','))
watch(unitsKey, () => {
  ensureUnitChannels()
  if(multiUnit.value && !running.value) void checkUnits()
})
watch(() => hwStore.holderList.length, ensureUnitChannels)

onMounted(async () => {
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
  ensureUnitChannels()
  metaEnabled.value = await useYamlConfig().isEnabled()
  if(multiUnit.value && !running.value && hasDevice.value) void checkUnits()
})
onBeforeUnmount(() => {
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
            :subtitle="multiUnit
              ? 'Capture a measurement from all connected units.'
              : 'Capture a measurement from the connected sensor device.'"
          >
            <template #title>
              <Tag
                data-test="measurement-status"
                :value="statusTag.label"
                :severity="statusTag.severity"
              />
            </template>
            <div
              class="flex flex-col gap-3"
              :class="chartSources.length > 1 ? '' : 'h-[clamp(320px,calc(100dvh-200px),1000px)]'"
            >
              <div
                v-for="source in chartSources"
                :key="source"
                :style="chartSources.length > 1
                  ? { height: `clamp(240px, calc((100dvh - 240px) / ${chartSources.length}), 600px)` }
                  : undefined"
                :class="chartSources.length > 1 ? '' : 'h-full'"
                data-test="live-chart"
              >
                <p
                  v-if="chartSources.length > 1"
                  class="text-xs ico-muted mb-1"
                >
                  {{ titleOf(source) }}
                </p>
                <LiveChart
                  class="h-full"
                  :frames="storages[source] ?? []"
                  :version="chartVersion"
                  :reset-token="chartReset"
                  :channels="channelsOf(source)"
                  :boundaries="{
                    xmin: mStore.chartStartTime,
                    xmax: mStore.chartEndTime,
                    ymin: mStore.chartYMin,
                    ymax: mStore.chartYMax
                  }"
                  :ift="ift_storage"
                  :draw-ift="iftRequested"
                  :ift-label="`IFT Value (${slotRepr(iftChannel)})`"
                  :max-points="maxNumberOfPoints"
                  :draw-time="mStore.chartMaximumDisplayedTime"
                  :sample-rate="liveSampleRate"
                />
              </div>
            </div>
          </ContentCard>
          <ContentCard
            v-if="metaEnabled"
            data-test="metadata-card"
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
          <MeasureDevicesCard />
          <PreflightCard
            v-if="multiUnit && !running"
            :result="preflight"
            :loading="preflightLoading"
            :error="preflightError"
            @check="checkUnits()"
          />
          <MeasureControlCard
            :ready="canMeasure"
            :state="state"
            :start-loading="startLoading"
            :stop-loading="stopLoading"
            @start="start"
            @stop="stop"
            @show="show"
            @hide="close"
          />
          <MeasureChannelsCard v-if="!running" />
          <PacketLossCard :loss-by-source="datalossBySource" />
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
