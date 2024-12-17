<script setup lang="ts">
import { getParsedMeasurement } from '@/api/requests.ts';
import Chart from '@/components/elements/charts/Chart.vue';
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import {
  ChartData,
  ChartOptions
} from 'chart.js';
import Button from 'primevue/button';
import {
  computed,
  onMounted,
  ref
} from 'vue';
import {
  useRoute,
  useRouter
} from 'vue-router';

const route = useRoute();
const router = useRouter();

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

const loadFile = async () => {
  if(route.query['file']) {
    const data = await getParsedMeasurement(route.query['file'] as string)

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
}

const chartOptions = computed<ChartOptions<'line'>>(() => {
  return {
    animation: false,
      responsive: true,
      scales: {
      x: {
        type: 'linear',
          max: chartBoundaries.value.xmax,
          min: chartBoundaries.value.xmin,
          ticks: {
          stepSize: 1
        },
        title: {
          text: 'Seconds passed',
            align: 'center',
            display: true
        }
      },
      y: {
        type: 'linear',
          max: chartBoundaries.value.ymax,
          min: chartBoundaries.value.ymin,
          ticks: {
          stepSize: 1
        }
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
            enabled: true
          },
          mode: 'xy',
        },
        pan: {
          enabled: true,
            mode: 'xy',
        }
      }
    }
  }
})

onMounted(async () => {
  await loadFile();
})
</script>

<template>
  <DefaultLayout>
    <TextBlock
      :heading="route.query['file']?.toString() ?? 'Analyze Measurement'"
      subheading="Analyze data from existing measurements."
      :button="true"
      button-text="Select File"
      button-icon-class="pi pi-file-import"
      @button-click="router.push('/files')"
    />
    <Chart
      v-if="chartData.labels && chartData.labels.length > 0"
      :data="chartData"
      :options="chartOptions"
    />
    <div
      v-else
      class="w-full flex justify-center items-center"
    >
      <Button
        label="Select File"
        icon="pi pi-file-import"
        class="my-10"
        @click="router.push('/files')"
      />
    </div>
  </DefaultLayout>
</template>

<style scoped>

</style>