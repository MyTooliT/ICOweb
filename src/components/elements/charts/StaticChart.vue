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
import { ChartBoundaries } from '@/components/elements/charts/staticChartHelper.ts';

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

Interaction.modes.interpolate = Interpolate;

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
  boundaries: ChartBoundaries
}>()

const emits = defineEmits<{
  (event: 'zoom', start: number, end: number): void,
}>()

const chartOptions = computed<ChartOptions<'line'>>(() => {
  return {
    animation: false,
    responsive: true,
    scales: {
      x: {
        type: 'linear',
        max: props.boundaries.xmax ?? 10,
        min: props.boundaries.xmin ?? 0,

        title: {
          text: 'Seconds passed',
          align: 'center',
          display: true
        }
      },
      y: {
        type: 'linear',
        max: props.boundaries.ymax ?? 10,
        min: props.boundaries.ymin ?? -10,

      }
    },
    plugins: {
      decimation: {
        enabled: true,
        algorithm: 'lldb',
      },
      crosshair: {
        callbacks: {
          afterZoom: () => function(start: number, end: number) {
            emits('zoom', start, end);
          }
        },
        snap: {
          enabled: true,
        }
      },
      tooltip: {
        mode: 'index',
        intersect: true,
      },
    },
    hover: {
      intersect: false,
    }
  }
})
</script>

<template>
  <div>
    <Line
      :data="data"
      :options="chartOptions" />
  </div>
</template>