<script setup lang="ts">
import {
  CategoryScale,
  Chart,
  ChartOptions,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import { Line } from 'vue-chartjs';
import { useMeasurementStore } from '@/stores/measurementStore/measurementStore.ts';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend
);
const mStore = useMeasurementStore()
const options: ChartOptions<'line'> = {
  animation: false,
  responsive: true
}
</script>

<template>
  <div>
    <Line
      ref="chart"
      :data="mStore.chartData"
      :options="options" />
  </div>
</template>

<style scoped>

</style>