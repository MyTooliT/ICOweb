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
  TimeScale,
  ChartYAxe
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { CrosshairPlugin, Interpolate } from 'chartjs-plugin-crosshair'
import Annotation, {AnnotationOptions} from 'chartjs-plugin-annotation';
import {computed} from 'vue';
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
  scales: Record<string, LinearScale>
}>()

const emits = defineEmits<{
  (event: 'zoom', start: number, end: number): void,
}>()

function computeChartAnnotations(ctx: any, scales: Record<string, ChartYAxe>): Record<string, AnnotationOptions> {
  const annotations: Record<string, AnnotationOptions> = {}
  Object.entries(scales).forEach(([unit, scale]) => {
    annotations[unit] = {
      type: 'label',
      xValue: 0,
      yValue: ctx.chart.scales[unit].bottom,
      font:{
        size: 14,
        weight: 'bold'
      },
      position: {
        x: 'start',
        y: 'end'
      },
      padding: {
        bottom: 20
      },
      xAdjust: (ctx.chart.scales[unit].left - ctx.chart.scales[unit].right) / 2,
      content: unit
    }
  })
  return annotations
}


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
      annotation: {
        clip: false,
        annotations(ctx: any) {
          return computeChartAnnotations(ctx, props.scales)
        }
      }
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