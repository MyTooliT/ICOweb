<script setup lang="ts">
/* eslint-disable-next-line max-len */
import {
  CategoryScale,
  Chart,
  ChartData,
  ChartOptions,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { computed } from 'vue';
import { Line } from 'vue-chartjs';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  zoomPlugin
);

const props = defineProps<{
  data: ChartData<'line'> ,
  options?: ChartOptions<'line'>
  boundaries?: {
    xmin: number,
    xmax: number,
    ymin: number,
    ymax: number
  }
}>()

const chartOptions = computed<ChartOptions<'line'>>(() => {
  return {
    animation: false,
    responsive: true,
    scales: {
      x: {
        type: 'linear',
        max: props.boundaries?.xmax ?? 10,
        min: props.boundaries?.xmin ?? 0,
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
        max: props.boundaries?.ymax ?? 10,
        min: props.boundaries?.ymin ?? -10,
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
          mode: 'x',
        },
        pan: {
          enabled: true,
          mode: 'x',
        }
      }
    }
  }
})
</script>

<template>
  <div>
    <Line
      ref="chartInstance"
      :data="data"
      :options="options ?? chartOptions" />
  </div>
</template>