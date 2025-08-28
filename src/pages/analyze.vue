<script setup lang="ts">
import StaticChart from '@/components/elements/charts/StaticChart.vue';
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import FileSelectionModal from '@/components/elements/modals/FileSelectionModal.vue';
import SplitLayout from '@/layouts/SplitLayout.vue';
import { ProgressBar, Button, Divider } from 'primevue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import {ChartData} from 'chart.js';
import {
  ChartBoundaries,
  DisplayableMeasurement,
  computeChartDataAndBoundaries,
  findNextClosestSmaller,
  fetchFileReader,
  consumeFileReader,
} from '@/components/elements/charts/staticChartHelper.ts';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {ParsedMetadata} from '@/client';
import MetadataAccordion from '@/components/elements/misc/MetadataAccordion.vue';
import {useHardwareStore} from '@/stores/hardwareStore/hardwareStore.ts';
import {getAPILink} from '@/api/icoapi.ts';
import DownloadButton from '@/components/elements/buttons/DownloadButton.vue';
import {Sensor, SensorType} from '@/stores/hardwareStore/classes/Sensor.ts';
import {parseSensorFromRaw} from '@/stores/hardwareStore/helper.ts';

const route = useRoute();
const router = useRouter();
const store = useGeneralStore();
const hwStore = useHardwareStore();

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
    store.fileSelectionModalVisible = false;
    const reader = await fetchFileReader(fileName)
    parsedData.value = await consumeFileReader(reader, fetchingProgress, parsedMetadata, fileName)
    if(parsedMetadata.value) {
      const sensors = getDatasetSensors(parsedMetadata.value)
      scales.value = computeChartScales(sensors)
      if(parsedMetadata.value.sensors.length > 0) {
        parsedData.value.datasets.forEach((dataset, index) => {
          dataset.name = parsedMetadata.value?.sensors[index].name ?? dataset.name
        })
      }
    }
    computeChartDataAndBoundaries(parsedData.value, chartData, chartBoundaries, datasetUnits.value)
  } else {
    store.fileSelectionModalVisible = true;
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

function downloadImage() {
  const image = getCanvasExport()
  const link = document.createElement('a')
  link.href = image
  link.download = route.query['file']?.toString().split('.')[0] + '.png'
  link.click()
}
</script>

<template>
  <SplitLayout
    v-if="chartData.datasets[0] && chartData.datasets[0].data.length > 0"
    class="h-stretch">
    <TextBlock
      heading="Analyze Measurement"
      subheading="Perform simple analysis on existing or external measurement files."
      :button="true"
      button-text="Select File"
      button-icon-class="pi pi-file-import"
      @button-click="store.fileSelectionModalVisible = true"
    />
    <StaticChart
      v-if="chartData.datasets[0] && chartData.datasets[0].data.length > 0"
      :data="chartData"
      :boundaries="chartBoundaries"
      :scales="scales"
      :title="route.query['file']?.toString() ?? 'Analyze Measurement'"
      @zoom="handleZoom"
    />
    <template #bottom>
      <div class="flex flex-col gap-3">
        <h4>Additional Actions</h4>
        <div class="flex flex-row gap-3">
          <Button
            label="Download View as PNG"
            as="a"
            variant="outlined"
            icon="pi pi-download"
            @click="downloadImage"
          />
          <DownloadButton
            :link="`${getAPILink()}/files/${route.query['file']}`"
            label="Download HDF5 File" />
        </div>
        <Divider />
        <h4>Measurement File Information</h4>
        <MetadataAccordion
          v-if="parsedMetadata"
          :parsed-metadata="parsedMetadata" />
      </div>
    </template>
  </SplitLayout>
  <div
    v-else-if="fetchingProgress > 0 && fetchingProgress < 100"
    class="w-full h-stretch max-h-60 flex justify-center items-center"
  >
    <div class="max-w-60 flex flex-col gap-4">
      <h4>Fetching Measurement</h4>
      <ProgressBar
        :value="fetchingProgress"
        :pt="{
          value: {
            style: ['transition: none;']
          }
        }" />
    </div>
  </div>
  <FileSelectionModal
    @upload="(event) => {
      const query = { ...route.query }
      query['file'] = (event as string)
      router.replace( { query } )
      store.fileSelectionModalVisible = false;
    }"
  />
</template>