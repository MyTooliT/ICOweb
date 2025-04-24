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
  Tooltip,
  TimeScale
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {useHardwareStore} from '@/stores/hardwareStore/hardwareStore.ts';
import {useMeasurementStore} from '@/stores/measurementStore/measurementStore.ts';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  zoomPlugin,
  TimeScale
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

const hwStore = useHardwareStore()
const mStore = useMeasurementStore()

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
          text: 'Seconds since measurement start',
          display: true
        }
      },
      yFirstChannel: {
        type: 'linear',
        display: true,
        title: {
          text: hwStore.activeHolder?.sensors?.find(sensor => sensor.channel === mStore.selectedChannels.first)?.sensor.name ?? 'First Channel',
          color: props.data.datasets[0]?.borderColor ?? 'black',
          display: true,
          padding: {top: 15, left: 0, right: 0, bottom: 10}
        }
      },
      ySecondChannel: {
        type: 'linear',
        display: mStore.activeChannels.second && mStore.selectedChannels.second > 0,
        title: {
          text: hwStore.activeHolder?.sensors?.find(sensor => sensor.channel === mStore.selectedChannels.second)?.sensor.name ?? 'Second Channel',
          color: props.data.datasets[1]?.borderColor ?? 'black',
          display: true,
          padding: {top: 15, left: 0, right: 0, bottom: 10}
        }
      },
      yThirdChannel: {
        type: 'linear',
        display: mStore.activeChannels.third && mStore.selectedChannels.third > 0,
        title: {
          text: hwStore.activeHolder?.sensors?.find(sensor => sensor.channel === mStore.selectedChannels.third)?.sensor.name ?? 'Third Channel',
          color: props.data.datasets[2]?.borderColor ?? 'black',
          display: true,
          padding: {top: 15, left: 0, right: 0, bottom: 10}
        }
      },
      yIFT: {
        type: 'linear',
        min: 0,
        ticks: {
          stepSize: 1
        },
        display: mStore.IFTRequested,
        title: {
          text: `${props.data.datasets[props.data.datasets.length - 1]?.label ?? 'IFT Value'}`,
          color: `${props.data.datasets[props.data.datasets.length - 1]?.backgroundColor ?? 'black'}`,
          display: true,
          padding: {top: 15, left: 0, right: 0, bottom: 10}
        },
        position: 'right',
      }
    },
    plugins: {
      decimation: {
        enabled: true,
        algorithm: 'min-max',
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
      :options="options ?? chartOptions" />
  </div>
</template>