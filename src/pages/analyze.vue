<script setup lang="ts">
import { getParsedMeasurement } from '@/api/requests.ts';
import { ParsedMeasurement } from '@/client';
import Chart from '@/components/elements/charts/Chart.vue';
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import FileSelectionModal from '@/components/elements/modals/FileSelectionModal.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { ChartData } from 'chart.js';
import {
  ref,
  watch
} from 'vue';
import {
  useRoute,
  useRouter
} from 'vue-router';

const route = useRoute();
const router = useRouter();
const store = useGeneralStore();

const chartData = ref<ChartData<'line'>>({
  labels: [],
  datasets: [{
    data: [],
    label: '',
  }]
})

const chartBoundaries = ref<{
  xmin: number,
  xmax: number,
  ymin: number,
  ymax: number
}>({
  xmin: 0,
  xmax: 10,
  ymin: 0,
  ymax: 10,
})

const handleParsedData = (data: ParsedMeasurement): void => {
  const newDatasets: Array<{ data: Array<number>, label: string }> = data.datasets.map((dataset, index) => {
    return {
      data: dataset.data,
      label: dataset.name,
      pointRadius: 1,
      borderColor: ['red', 'green', 'blue', 'yellow', 'purple'][index],
    }
  })
  const newLabels: Array<number> = data.timestamp.map(ts => ts / 1000000)

  chartData.value = {
    labels: newLabels,
    datasets: newDatasets
  }

  const flattenedYValues = newDatasets.map(ds => ds.data).flat()

  chartBoundaries.value = {
    xmin: newLabels[0],
    xmax: newLabels[newLabels.length - 1],
    ymin: Math.min(...flattenedYValues),
    ymax: Math.max(...flattenedYValues)
  }
}

const handleRouteWatch = async () => {
  if(route.query['file']) {
    store.fileSelectionModalVisible = false;
    const data = await getParsedMeasurement(route.query['file'] as string)
    handleParsedData(data)
  } else {
    store.fileSelectionModalVisible = true;
  }
}

watch(() => route.query['file'], handleRouteWatch, { immediate: true });
</script>

<template>
  <DefaultLayout>
    <TextBlock
      :heading="route.query['file']?.toString() ?? 'Analyze Measurement'"
      subheading="Analyze data from existing measurements."
      :button="true"
      button-text="Select File"
      button-icon-class="pi pi-file-import"
      @button-click="store.fileSelectionModalVisible = true"
    />
    <Chart
      v-if="chartData.labels && chartData.labels.length > 0"
      :data="chartData"
      :boundaries="chartBoundaries"
    />
    <FileSelectionModal
      @upload="(event) => {
        handleParsedData(event as ParsedMeasurement);
        store.fileSelectionModalVisible = false;
      }"
    />
  </DefaultLayout>
</template>

<style scoped>

</style>