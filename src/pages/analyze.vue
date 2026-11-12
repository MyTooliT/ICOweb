<script setup lang="ts">
import StaticChart from '@/components/charts/StaticChart.vue';
import FileSelection from '@/components/misc/FileSelection.vue';
import DefaultLayout from '@base/layout/DefaultLayout.vue';
import ContentCard from '@/components/misc/ContentCard.vue';
import { ProgressBar, Button, Popover } from 'primevue';
import {ChartData} from 'chart.js';
import {
  ChartBoundaries,
  DisplayableMeasurement,
  computeChartDataAndBoundaries,
  findNextClosestSmaller,
  fetchFileReader,
  consumeFileReader,
} from '@/components/charts/staticChartHelper.ts';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {ParsedMetadata} from '@/client';
import MetadataAccordion from '@/components/misc/MetadataAccordion.vue';
import {getAPILink} from '@/api/icoapi.ts';
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

const routerWatcher = async () => {
  if(route.query['file']) {
    const fileName = route.query['file'].toString();
    const reader = await fetchFileReader(fileName)
    parsedData.value = await consumeFileReader(reader, fetchingProgress, parsedMetadata, fileName)
    if(parsedMetadata.value) {
      const sensors = getDatasetSensors(parsedMetadata.value)
      scales.value = computeChartScales(sensors)
      datasetUnits.value = sensors.map(sensor => sensor.sensorType.physicalUnit)
      if(parsedMetadata.value.sensors.length > 0) {
        parsedData.value.datasets.forEach((dataset, index) => {
          dataset.name = parsedMetadata.value?.sensors[index].name ?? dataset.name
        })
      }
    }
    computeChartDataAndBoundaries(parsedData.value, chartData, chartBoundaries, datasetUnits.value)
  }
}

function handleZoom(start: number, end: number): void {
  if(!parsedData.value) {return}
  const startIndex = findNextClosestSmaller(parsedData.value.timestamp, start)
  const endIndex = findNextClosestSmaller(parsedData.value.timestamp, end)
  computeChartDataAndBoundaries(parsedData.value, chartData, chartBoundaries,  datasetUnits.value, startIndex, endIndex)
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

watch(() => route.query['file'], routerWatcher, { immediate: true });

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
