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
import Annotation from 'chartjs-plugin-annotation';
import {computed} from 'vue';
import { Line } from 'vue-chartjs';
import {ChartBoundaries} from '@/components/elements/charts/staticChartHelper.ts';

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
  TimeScale,
  Annotation
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
  boundaries: ChartBoundaries,
  scales: Record<string, Chart.ChartYAxe>,
  title: string,
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
        max: props.boundaries.xmax,
        min: props.boundaries.xmin,
        title: {
          text: 'Seconds since measurement start',
          display: true
        }
      },
      y: {display: false},
      ...props.scales
    },
    plugins: {
      title: {
        text: props.title,
        display: true,
        position: 'top',
        font: {
          size: '16',
          style: 'normal',
          weight: 'bold'
        }
      },
      decimation: {
        enabled: false,
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
      }
    },
    hover: {
      intersect: false,
    }
  }
})
</script>

<template>
  <div class="block relative">
    <Line
      :data="data"
      :options="chartOptions" />
  </div>
</template>

<style>
.reset-zoom {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 100;
  padding: 0.5rem 0.75rem;
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  border: 1px solid var(--md-sys-color-on-primary-container);
  border-radius: 0.25rem;
  cursor: pointer;
}
</style>