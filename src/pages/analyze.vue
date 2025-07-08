<script setup lang="ts">
import StaticChart from '@/components/elements/charts/StaticChart.vue';
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import FileSelectionModal from '@/components/elements/modals/FileSelectionModal.vue';
import SplitLayout from '@/layouts/SplitLayout.vue';
import { ProgressBar } from 'primevue';
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

const route = useRoute();
const router = useRouter();
const store = useGeneralStore();

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
    store.lastFileQuery = fileName;
    store.fileSelectionModalVisible = false;
    const reader = await fetchFileReader(fileName)
    parsedData.value = await consumeFileReader(reader, fetchingProgress, parsedMetadata, fileName)
    computeChartDataAndBoundaries(parsedData.value, chartData, chartBoundaries)
  } else {
    store.fileSelectionModalVisible = true;
  }
}

function handleZoom(start: number, end: number): void {
  if(!parsedData.value) {return}
  const startIndex = findNextClosestSmaller(parsedData.value.timestamp, start)
  const endIndex = findNextClosestSmaller(parsedData.value.timestamp, end)
  computeChartDataAndBoundaries(parsedData.value, chartData, chartBoundaries , startIndex, endIndex)
}

watch(() => route.query['file'], routerWatcher, { immediate: true });
</script>

<template>
  <SplitLayout
    v-if="chartData.datasets[0] && chartData.datasets[0].data.length > 0"
    class="h-stretch">
    <TextBlock
      :heading="route.query['file']?.toString() ?? 'Analyze Measurement'"
      subheading="Analyze data from existing measurements."
      :button="true"
      button-text="Select File"
      button-icon-class="pi pi-file-import"
      @button-click="store.fileSelectionModalVisible = true"
    />
    <StaticChart
      v-if="chartData.datasets[0] && chartData.datasets[0].data.length > 0"
      :data="chartData"
      :boundaries="chartBoundaries"
      @zoom="handleZoom"
    />
    <template #aside />
    <template #bottom>
      <MetadataAccordion
        v-if="parsedMetadata"
        :parsed-metadata="parsedMetadata" />
    </template>
  </SplitLayout>
  <div
    v-else
    class="w-full h-stretch max-h-60 flex justify-center items-center"
  >
    <div class="max-w-60 flex flex-col gap-4">
      <h4>Fetching Measurement</h4>
      <ProgressBar
        :value="fetchingProgress"
        :pt="{
          value: {
            style: ['transition-duration: .25s;']
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