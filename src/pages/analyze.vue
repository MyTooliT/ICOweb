<script setup lang="ts">
import { getAPILink } from '@/api/icoapi.ts';
import StaticChart from '@/components/elements/charts/StaticChart.vue';
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import FileSelectionModal from '@/components/elements/modals/FileSelectionModal.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import {ProgressBar} from 'primevue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import {ChartData, ChartOptions, ChartDataset} from 'chart.js';
import {
  ChartBoundaries,
  DisplayableMeasurement,
  getSubsetOfMeasurement,
  computeChartBoundaries,
  processLine,
  findNextClosestSmaller
} from '@/components/elements/charts/staticChartHelper.ts';
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

const chartBoundaries = ref<ChartBoundaries>({
  xmin: 0,
  xmax: 10,
  ymin: 0,
  ymax: 10,
})

const progress = ref<number>(0)
const data = ref<DisplayableMeasurement|undefined>(undefined)

const handleParsedData = (
    data: DisplayableMeasurement,
    startIndex: number = 0,
    endIndex: number|undefined = undefined): void => {
  const newDatasets = getSubsetOfMeasurement(data, startIndex, endIndex);
  const dataOnly = newDatasets.map(set => set.data as Chart.ChartPoint[])

  chartData.value = {
    datasets: newDatasets as ChartDataset<'line', Chart.Point[]>[]
  }
  chartBoundaries.value = { ...computeChartBoundaries(dataOnly) }
}

const handleRouteWatch = async () => {
  if(route.query['file']) {
    store.lastFileQuery = route.query['file'].toString();
    store.fileSelectionModalVisible = false;
    data.value = await fetchParsedMeasurement(route.query['file'].toString())
    handleParsedData(data.value)
  } else {
    store.fileSelectionModalVisible = true;
  }
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
        processLine(line, combinedResult, progress)
      }

      // Keep the last incomplete line for the next iteration
      receivedText = lines[lines.length - 1];
    }
  } catch (error) {
    console.log('This should never be reached - if it was, good luck');
    throw error
  }

  return combinedResult;
}

function handleZoom(start: number, end: number): void {
  if(!data.value) {return}
  const startIndex = findNextClosestSmaller(data.value.timestamp, start)
  const endIndex = findNextClosestSmaller(data.value.timestamp, end)
  handleParsedData(data.value, startIndex, endIndex)
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
        algorithm: 'lldb',
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
          afterZoom: () => function(start: number, end: number) {
            handleZoom(start, end);
          }
        },
        snap: {
          enabled: true,
        }
      },
      tooltip: {
        mode: 'index',
        intersect: true,
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
    <StaticChart
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