<script setup lang="ts">
/* eslint-disable-next-line max-len */
import { useMeasurementStore } from '@/stores/measurementStore/measurementStore.ts';
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
import zoomPugin from 'chartjs-plugin-zoom';
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
  zoomPugin
);

const mStore = useMeasurementStore()

const options = computed<ChartOptions<'line'>>(() => {
  return {
    animation: false,
    responsive: true,
    scales: {
      x: {
        type: 'linear',
        max: mStore.acquisitionTime,
        min: 0,
        ticks: {
          stepSize: 1
        },
        title: {
          text: 'Seconds passed',
          align: 'center',
          display: true
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

defineProps<{ data: ChartData<'line'> }>()
</script>

<template>
  <div>
    <Line
      ref="chartInstance"
      :data="data"
      :options="options" />
  </div>
</template>

<style scoped>

</style>