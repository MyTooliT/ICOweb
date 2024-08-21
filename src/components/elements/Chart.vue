<script setup lang="ts">
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
import { Line } from 'vue-chartjs';

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

const options: ChartOptions<'line'> = {
  animation: false,
  responsive: true
}

defineProps<{ data: ChartData<'line'> }>()
</script>

<template>
  <div>
    <Line
      ref="chart"
      :data="data"
      :options="options" />
  </div>
</template>

<style scoped>

</style>