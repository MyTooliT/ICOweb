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
  Interaction,
  TimeScale
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { CrosshairPlugin, Interpolate } from 'chartjs-plugin-crosshair'
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
  zoomPlugin,
  TimeScale
);

Interaction.modes.Interpolate = Interpolate;

// eslint-disable-next-line max-len
// https://github.com/AbelHeinsbroek/chartjs-plugin-crosshair/issues/119#issuecomment-1748680274
// Dont use the plugin as it is. Error in afterDraw function
// Chart.register(CrosshairPlugin);
const CustomCrosshairPlugin = function (plugin: any) {
  const originalAfterDraw = plugin.afterDraw;
  plugin.afterDraw = function(chart: any, easing: any) {
    if (chart && chart.crosshair) {
      originalAfterDraw.call(this, chart, easing);
    }
  };
  return plugin;
};

Chart.register(CustomCrosshairPlugin(CrosshairPlugin));

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
    }
  }
})
</script>

<template>
  <div>
    <Line
      ref="chartInstanceStatic"
      :data="data"
      :options="options ?? chartOptions" />
  </div>
</template>