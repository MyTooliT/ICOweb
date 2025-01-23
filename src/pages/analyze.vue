<script setup lang="ts">
import { getAPILink } from '@/api/api.ts';
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
  const maxPoints = 2000
  const length = data.timestamp.length
  const interval = length >= maxPoints ? Math.floor(length / maxPoints) : 1
  const newDatasets: Array<{ data: Array<number>, label: string }> = data.datasets.map((dataset, index) => {
    const y: number[] = []
    for (let i = 0; i <= length; i += interval) {
      y.push(dataset.data[i])
    }
    return {
      data: y,
      label: dataset.name,
      pointRadius: 1,
      borderColor: ['red', 'green', 'blue', 'yellow', 'purple'][index],
    }
  })
  
  const newLabels: Array<number> = []
  for (let i = 0; i <= length; i += interval) {
    newLabels.push(data.timestamp[i] / 1000000)
  }

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
    store.lastFileQuery = route.query['file'].toString();
    store.fileSelectionModalVisible = false;
    const data = await fetchParsedMeasurement(route.query['file'].toString())
    handleParsedData(data)
  } else {
    store.fileSelectionModalVisible = true;
  }
}

// eslint-disable-next-line max-len
async function fetchParsedMeasurement(fileName: string): Promise<ParsedMeasurement> {
  const response = await fetch(`${getAPILink()}/files/analyze/${fileName}`);
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to read response body');
  }

  const decoder = new TextDecoder('utf-8');
  let receivedText = '';
  let combinedResult: ParsedMeasurement = {
    name: fileName,
    counter: [],
    timestamp: [],
    datasets: []
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      receivedText += decoder.decode(value, { stream: true });
      const lines = receivedText.split('\n');

      // Process each line except the last (incomplete line)
      for (const line of lines.slice(0, -1)) {
        if (!line.trim()) continue;

        const parsedLine = JSON.parse(line);

        if (parsedLine.progress !== undefined) {
          console.log(`Progress: ${(parsedLine.progress * 100).toFixed(2)}%`);
        } else {
          const chunk: ParsedMeasurement = parsedLine;

          combinedResult.counter.push(...chunk.counter);
          combinedResult.timestamp.push(...chunk.timestamp);

          chunk.datasets.forEach((dataset) => {
            // eslint-disable-next-line max-len
            const existingDataset = combinedResult.datasets.find(d => d.name === dataset.name);
            if (existingDataset) {
              existingDataset.data.push(...dataset.data);
            } else {
              combinedResult.datasets.push({
                name: dataset.name,
                data: [...dataset.data]
              });
            }
          });
        }
      }

      // Keep the last incomplete line for the next iteration
      receivedText = lines[lines.length - 1];
    }
  } catch (error) {
    console.log('This should never be reached - if it was, good luck');
    throw error
  }


  console.log('File parsing complete.');
  console.log(combinedResult.timestamp.length);
  return combinedResult;
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
        const query = { ...route.query }
        query['file'] = (event as string)
        router.replace( { query } )
        store.fileSelectionModalVisible = false;
      }"
    />
  </DefaultLayout>
</template>

<style scoped>

</style>