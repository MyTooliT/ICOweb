<script setup lang="ts">
import { getAPILink } from '@/api/api.ts';
import { ParsedMeasurement } from '@/client';
import Chart from '@/components/elements/charts/Chart.vue';
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import FileSelectionModal from '@/components/elements/modals/FileSelectionModal.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import {ProgressBar} from 'primevue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import {ChartData, ChartOptions} from 'chart.js';
import {
  computed,
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

const progress = ref<number>(0)

const handleParsedData = (data: DisplayableMeasurement): void => {
  const maxPoints = 2000
  const length = data.timestamp.length
  const interval = length >= maxPoints ? Math.floor(length / maxPoints) : 1
  const newDatasets = data.datasets.map((dataset, index) => {
    const subset: Array<{x: number, y: number}> = []
    for (let i = 0; i <= length; i += interval) {
      subset.push(dataset.data[i])
    }
    return {
      data: subset,
      label: dataset.name,
      pointRadius: 1,
      borderColor: ['red', 'green', 'blue', 'yellow', 'purple'][index],
    }
  })
  console.log(newDatasets)

  const newLabels: Array<number> = []
  for (let i = 0; i <= length; i += interval) {
    newLabels.push(data.timestamp[i] / 1000000)
  }

  chartData.value = {
    datasets: newDatasets
  }

  const flattenedYValues: number[] = newDatasets.map(ds => ds.data).flat().map(data => data.y)

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
    console.log(data)
    handleParsedData(data)
  } else {
    store.fileSelectionModalVisible = true;
  }
}

type DisplayableMeasurement = {
  name: string,
  counter: number[],
  timestamp: number[],
  datasets: Array<{
        name: string,
        data: Array<{ x: number, y: number }>
      }>
}

// eslint-disable-next-line max-len
async function fetchParsedMeasurement(fileName: string): Promise<DisplayableMeasurement> {
  const response = await fetch(`${getAPILink()}/files/analyze/${fileName}`);
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to read response body');
  }

  const decoder = new TextDecoder('utf-8');
  let receivedText = '';
  let combinedResult: DisplayableMeasurement = {
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
          progress.value = Math.floor(parsedLine.progress * 100)
        } else {
          const chunk: ParsedMeasurement = parsedLine;

          combinedResult.counter.push(...chunk.counter);
          combinedResult.timestamp.push(...chunk.timestamp);

          chunk.datasets.forEach((dataset) => {
            const combined = []
            for(let i = 0; i < chunk.timestamp.length; i++) {
              combined.push({
                x: chunk.timestamp[i] / 1000000,
                y: dataset.data[i],
              })
            }
            // eslint-disable-next-line max-len
            const existingDataset = combinedResult.datasets.find(d => d.name === dataset.name);
            if (existingDataset) {
              existingDataset.data.push(...combined);
            } else {
              combinedResult.datasets.push({
                name: dataset.name,
                data: [...combined]
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

const chartOptions = computed<ChartOptions<'line'>>(() => {
  return {
    animation: false,
    responsive: true,
    scales: {
      x: {
        type: 'linear',
        max: chartBoundaries.value.xmax ?? 10,
        min: chartBoundaries.value.xmin ?? 0,

        title: {
          text: 'Seconds passed',
          align: 'center',
          display: true
        }
      },
      y: {
        type: 'linear',
        max: chartBoundaries.value.ymax ?? 10,
        min: chartBoundaries.value.ymin ?? -10,

      }
    },
    plugins: {
      decimation: {
        enabled: true,
        algorithm: 'min-max',
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: false
          },
          mode: 'x',
        },
        pan: {
          enabled: false
        }
      },
      crosshair: {
        callbacks: {
          afterZoom: () => function(start, end) {
            console.log(start, end)
          }
        },
        snap: {
          enabled: true,
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    hover: {
      intersect: false,
    }
  }
})
watch(() => route.query['file'], handleRouteWatch, { immediate: true });
</script>

<template>
  <DefaultLayout class="h-stretch">
    <TextBlock
      :heading="route.query['file']?.toString() ?? 'Analyze Measurement'"
      subheading="Analyze data from existing measurements."
      :button="true"
      button-text="Select File"
      button-icon-class="pi pi-file-import"
      @button-click="store.fileSelectionModalVisible = true"
    />
    <Chart
      v-if="chartData.datasets[0] && chartData.datasets[0].data.length > 0"
      :data="chartData"
      :options="chartOptions"
    />
    <div
      v-else
      class="w-full h-stretch max-h-60 flex justify-center items-center"
    >
      <div class="max-w-60 flex flex-col gap-4">
        <h4>Fetching Measurement</h4>
        <ProgressBar 
          :value="progress" 
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
  </DefaultLayout>
</template>

<style scoped>

</style>