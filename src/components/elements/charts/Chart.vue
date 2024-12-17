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
import zoomPlugin from 'chartjs-plugin-zoom';
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

const mStore = useMeasurementStore()

defineProps<{
  data: ChartData<'line'> ,
  options: ChartOptions<'line'>
}>()
</script>

<template>
  <div>
    <Line
      ref="chartInstance"
      :data="data"
      :options="options" />
  </div>
</template>