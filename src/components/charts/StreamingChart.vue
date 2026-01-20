<script setup lang="ts">
/* eslint-disable-next-line max-len */
import {
  Chart,
  ChartData,
  ChartOptions,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import { ChartBoundaries } from '@/components/charts/staticChartHelper.ts';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

const props = defineProps<{
  data: ChartData<'line'> ,
  options?: ChartOptions<'line'>
  boundaries?: ChartBoundaries,
  scales: Record<string, Chart.ChartYAxe>
}>()

// @ts-ignore
const chartOptions = computed<ChartOptions<'line'>>(() => {
  return {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        max: props.boundaries?.xmax ?? 10,
        min: props.boundaries?.xmin ?? 0,
        ticks: {
          stepSize: 1
        },
        title: {
          text: 'Seconds since measurement start',
          display: true
        }
      },
      y: {display: false},
      ...props.scales
    },
    plugins: {
      decimation: {
        enabled: true,
        algorithm: 'min-max',
      },
      crosshair: {
        enabled: false
      },
      zoom: {
        enabled: false
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'xy',
      intersect: false,
    }
  }
})
</script>

<template>
  <div>
    <Line
      ref="chartInstance"
      :data="data"
      :options="chartOptions" />
  </div>
</template>