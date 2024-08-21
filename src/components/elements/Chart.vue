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
import {
  useMeasurementStore
} from '@/stores/measurementStore/measurementStore.ts';
import {
  computed,
} from 'vue';

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