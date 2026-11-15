<script setup lang="ts">
import StaticChart from '@/components/charts/StaticChart.vue';
import FileSelection from '@/components/misc/FileSelection.vue';
import DefaultLayout from '@base/layout/DefaultLayout.vue';
import ContentCard from '@/components/misc/ContentCard.vue';
import { ProgressBar, Button, Popover } from 'primevue';
import Select from 'primevue/select';
import ToggleSwitch from 'primevue/toggleswitch';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import {ChartData} from 'chart.js';
import {
  ChartBoundaries,
  DisplayableMeasurement,
  computeChartDataAndBoundaries,
  findNextClosestSmaller,
  fetchFileReader,
  consumeFileReader,
  computeOverlayChart,
  mergeSources,
  SourceMeasurement,
} from '@/components/charts/staticChartHelper.ts';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {ParsedMetadata} from '@/client';
import MetadataAccordion from '@/components/misc/MetadataAccordion.vue';
import {getAPILink, getMeasurementFiles} from '@/api/icoapi.ts';
import {useMessageBus} from '@/message';
import DownloadButton from '@/components/buttons/DownloadButton.vue';
import {Sensor, SensorType} from '@/stores/hardwareStore/classes/Sensor.ts';
import {parseSensorFromRaw} from '@/stores/hardwareStore/helper.ts';

const route = useRoute();
const router = useRouter();

const chartData = ref<ChartData<'line'>>({
  datasets: [{
    data: [],
    label: '',
  }]
})

const chartBoundaries = ref<ChartBoundaries>({
  xmin: 0,
  xmax: 10,
  ymin: 0,
  ymax: 10,
})

const fetchingProgress = ref<number>(0)
const parsedData = ref<DisplayableMeasurement|undefined>(undefined)
const parsedMetadata = ref<ParsedMetadata | undefined>(undefined)

const m = useMessageBus()

/*
 * A file of several STUs has one source for every STU (see the multi STU
 * support of the API). Every source has its own data and its own clock. They
 * are shown one at a time, or all together (overlay): Then the start time of
 * every source places its data on a common time axis.
 */
const sourceNames = ref<string[]>([])
const selectedSource = computed<string | null>(
  () => route.query['source']?.toString() ?? null)
const overlay = computed<boolean>(() => route.query['overlay'] === '1')
const hasSeveralSources = computed(() => sourceNames.value.length > 1)

/** The names of the sources of a file (empty for files in the old format) */
async function sourcesOf(fileName: string): Promise<string[]> {
  try {
    const listing = await getMeasurementFiles()
    return listing.files.find(file => file.name === fileName)?.sources ?? []
  } catch {
    return []
  }
}

/** Give the datasets the names of their sensors */
function nameDatasets(data: DisplayableMeasurement, meta: ParsedMetadata | undefined) {
  if(meta && meta.sensors.length > 0) {
    data.datasets.forEach((dataset, index) => {
      dataset.name = meta.sensors[index]?.name ?? dataset.name
    })
  }
}

async function showSingle(fileName: string, source: string | null) {
  const reader = await fetchFileReader(fileName, source)
  parsedData.value = await consumeFileReader(reader, fetchingProgress, parsedMetadata, fileName)
  if(parsedMetadata.value) {
    const sensors = getDatasetSensors(parsedMetadata.value)
    scales.value = computeChartScales(sensors)
    datasetUnits.value = sensors.map(sensor => sensor.sensorType.physicalUnit)
    nameDatasets(parsedData.value, parsedMetadata.value)
  }
  computeChartDataAndBoundaries(parsedData.value, chartData, chartBoundaries, datasetUnits.value)
}

async function showOverlay(fileName: string) {
  const items: SourceMeasurement[] = []
  const sensors: Sensor[] = []
  let firstMetadata: ParsedMetadata | undefined = undefined
  for(const source of sourceNames.value) {
    const meta = ref<ParsedMetadata | undefined>(undefined)
    const reader = await fetchFileReader(fileName, source)
    const data = await consumeFileReader(reader, fetchingProgress, meta, fileName)
    nameDatasets(data, meta.value)
    if(meta.value) {
      firstMetadata ??= meta.value
      sensors.push(...getDatasetSensors(meta.value))
    }
    items.push({
      source,
      offset: meta.value?.sources?.find(info => info.name === source)?.start_offset ?? 0,
      data
    })
  }
  parsedMetadata.value = firstMetadata
  parsedData.value = mergeSources(items)
  scales.value = computeChartScales(sensors)
  datasetUnits.value = sensors.map(sensor => sensor.sensorType.physicalUnit)
  computeOverlayChart(parsedData.value, chartData, chartBoundaries, datasetUnits.value)
}

const routerWatcher = async () => {
  const fileName = route.query['file']?.toString()
  if(!fileName) return
  try {
    sourceNames.value = await sourcesOf(fileName)
    if(hasSeveralSources.value && !overlay.value && !selectedSource.value) {
      // The API needs to know which source to show: this runs again
      await router.replace({
        query: { ...route.query, source: sourceNames.value[0] }
      })
      return
    }
    if(hasSeveralSources.value && overlay.value) {
      await showOverlay(fileName)
    } else {
      await showSingle(fileName, hasSeveralSources.value ? selectedSource.value : null)
    }
  } catch(e: any) {
    fetchingProgress.value = 0
    m.error('The file could not be opened', e?.message ?? String(e), 6000)
  }
}

function handleZoom(start: number, end: number): void {
  if(!parsedData.value) {return}
  if(overlay.value && hasSeveralSources.value) {
    computeOverlayChart(
      parsedData.value, chartData, chartBoundaries, datasetUnits.value, start, end)
    return
  }
  const startIndex = findNextClosestSmaller(parsedData.value.timestamp, start)
  const endIndex = findNextClosestSmaller(parsedData.value.timestamp, end)
  computeChartDataAndBoundaries(parsedData.value, chartData, chartBoundaries,  datasetUnits.value, startIndex, endIndex)
}

function selectSource(source: string | null) {
  const query = { ...route.query }
  if(source) query['source'] = source
  delete query['overlay']
  router.replace({ query })
}

function setOverlay(on: boolean) {
  const query = { ...route.query }
  if(on) {
    query['overlay'] = '1'
    delete query['source']
  } else {
    delete query['overlay']
    query['source'] = sourceNames.value[0]
  }
  router.replace({ query })
}

const scales = ref<Record<string, Chart.ChartYAxe>>({})
const datasetUnits = ref<string[]>([])

function getDatasetSensors(meta: ParsedMetadata): Sensor[] {
  return meta.sensors.map(sensor_raw => parseSensorFromRaw(sensor_raw))
}

function computeChartScales(sensors: Sensor[]): Record<string, Chart.ChartYAxe> {
  const scales: Record<string, Chart.ChartYAxe> = {}
  const uniqueDimensionChannels: Array<SensorType> = []
  sensors.forEach(sensor => {
    if(!sensor) return
    if(!uniqueDimensionChannels.map(udc => udc.physicalDimension).includes(sensor?.sensorType.physicalDimension)) {
      uniqueDimensionChannels.push(new SensorType(
          sensor?.sensorType.physicalDimension,
          sensor?.sensorType.physicalUnit
      ))
    }
  })
  uniqueDimensionChannels.forEach(udc => {
    scales[udc.physicalUnit] = {
      position: 'left',
      type: 'linear',
      // @ts-ignore
      title: {
        display: true,
        text: `${udc.physicalDimension !== '' ? udc.physicalDimension + ' in ' : ''}${udc.physicalUnit}`,
      }
    }
  })
  return scales
}

watch(
  () => [route.query['file'], route.query['source'], route.query['overlay']],
  routerWatcher,
  { immediate: true }
);

function getCanvasExport() {
  const canvas = document.getElementsByTagName('canvas')[0]
  if(!canvas) {return ''}
  return canvas.toDataURL( 'image/png')
}

// File selection for an already opened measurement, next to its button
const fileSelection = ref<InstanceType<typeof Popover> | null>(null)

function openFile(name: string) {
  fileSelection.value?.hide()
  const query = { ...route.query }
  query['file'] = name
  router.replace({ query })
}

const fileName = computed<string>(() => route.query['file']?.toString() ?? '')

// Short summary of the measurement for the card header
const summary = computed<string>(() => {
  const data = parsedData.value
  if(!data) return ''
  const parts = [`${data.datasets.length} channel${data.datasets.length === 1 ? '' : 's'}`]
  const timestamps = data.timestamp
  if(timestamps.length > 1) {
    parts.push(`${(timestamps[timestamps.length - 1] - timestamps[0]).toFixed(2)} s`)
  }
  parts.push(`${timestamps.length.toLocaleString()} samples`)
  return parts.join(' · ')
})

function downloadImage() {
  const image = getCanvasExport()
  const link = document.createElement('a')
  link.href = image
  link.download = route.query['file']?.toString().split('.')[0] + '.png'
  link.click()
}
</script>

<template>
  <DefaultLayout
    v-if="chartData.datasets[0] && chartData.datasets[0].data.length > 0"
  >
    <div class="flex flex-col gap-3">
      <ContentCard
        :title="fileName"
        :subtitle="summary"
      >
        <template #actions>
          <div
            v-if="hasSeveralSources"
            class="flex flex-row items-center gap-3"
            data-test="source-selection"
          >
            <label class="flex flex-row items-center gap-2 text-sm">
              <ToggleSwitch
                :model-value="overlay"
                aria-label="Show all sources in one chart"
                @update:model-value="setOverlay"
              />
              Overlay
            </label>
            <Select
              v-if="!overlay"
              :model-value="selectedSource"
              :options="sourceNames"
              aria-label="Source"
              size="small"
              @update:model-value="selectSource"
            />
          </div>
          <Button
            label="Select File"
            icon="pi pi-file-import"
            size="small"
            outlined
            @click="(event: Event) => fileSelection?.toggle(event)"
          />
          <Popover ref="fileSelection">
            <FileSelection
              class="w-[32rem] max-w-[calc(100vw-2rem)]"
              @upload="openFile"
            />
          </Popover>
          <Button
            label="PNG"
            icon="pi pi-image"
            size="small"
            outlined
            aria-label="Download view as PNG"
            v-tooltip.top="'Download the current view as PNG image'"
            @click="downloadImage"
          />
          <DownloadButton
            :link="`${getAPILink()}/files/${fileName}`"
            label="HDF5"
            tooltip="Download the measurement file"
            small
          />
        </template>
        <StaticChart
          :data="chartData"
          :boundaries="chartBoundaries"
          :scales="scales"
          title=""
          @zoom="handleZoom"
        />
      </ContentCard>
      <ContentCard
        v-if="(parsedMetadata?.sources?.length ?? 0) > 1"
        title="Sources"
        subtitle="Every STU is a source with its own clock. The offset is the time between the earliest start and the start of the source."
        flush
      >
        <DataTable
          :value="parsedMetadata?.sources"
          data-test="sources-table"
        >
          <Column
            field="name"
            header="Source"
          />
          <Column
            field="stu_mac"
            header="STU"
          />
          <Column
            field="sth_mac"
            header="STH"
          />
          <Column
            field="start_time"
            header="Start"
          />
          <Column header="Offset">
            <template #body="{ data }">
              {{ data.start_offset == null ? '–' : `${data.start_offset.toFixed(3)} s` }}
            </template>
          </Column>
        </DataTable>
      </ContentCard>
      <ContentCard
        v-if="parsedMetadata"
        title="Measurement File Information"
        flush
      >
        <MetadataAccordion :parsed-metadata="parsedMetadata" />
      </ContentCard>
    </div>
  </DefaultLayout>
  <DefaultLayout
    v-else-if="fetchingProgress > 0 && fetchingProgress < 100"
  >
    <ContentCard
      title="Loading Measurement"
      :subtitle="fileName"
      class="max-w-md mx-auto mt-[15vh]"
    >
      <ProgressBar
        :value="Math.round(fetchingProgress)"
        :pt="{
          value: {
            style: ['transition: none;']
          }
        }" />
    </ContentCard>
  </DefaultLayout>
  <DefaultLayout v-else>
    <ContentCard
      title="Select a Measurement"
      subtitle="Choose the measurement file to analyze."
      class="max-w-xl mx-auto mt-[15vh]"
    >
      <FileSelection @upload="openFile" />
    </ContentCard>
  </DefaultLayout>
</template>
