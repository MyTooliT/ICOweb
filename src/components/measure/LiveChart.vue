<script setup lang="ts">
import StreamingChart from '@/components/charts/StreamingChart.vue';
import { updateChartData } from '@/components/charts/streamingChartHelper.ts';
import { ChartBoundaries } from '@/components/charts/staticChartHelper.ts';
import { MeasurementDataFrame } from '@/stores/measurementStore/measurementStore.ts';
import { TPoint } from '@/utils/useMeasurementWebSocket.ts';
import { TSlot } from '@/utils/measureSlots.ts';
import { ChartData } from 'chart.js';
import { computed, ref, Ref, shallowRef, toRef, watch } from 'vue';

/** An active channel of the chart */
export type LiveChannel = {
  slot: TSlot
  label: string
  unit: string
  dimension: string
}

/**
 * The live data of one source (the data of one unit).
 *
 * The page changes `version` when there is new data in `frames`. The frames
 * are not watched: there can be thousands per second, so the page decides how
 * often the chart is drawn.
 */
const props = withDefaults(defineProps<{
  frames: Array<MeasurementDataFrame>
  version: number
  channels: Array<LiveChannel>
  boundaries: ChartBoundaries
  ift?: Array<TPoint>
  drawIft?: boolean
  iftLabel?: string
  /** Number of points per channel the chart shows at most */
  maxPoints?: number
  /** Seconds of data shown */
  drawTime?: number
  sampleRate?: number
  /** Changes when the chart starts over (new measurement) */
  resetToken?: number
}>(), {
  ift: () => [],
  drawIft: false,
  iftLabel: 'IFT',
  maxPoints: 1000,
  drawTime: 10,
  sampleRate: 3175,
  resetToken: 0
})

// Replaced as a whole at every draw. Not deeply reactive: Chart.js reads
// thousands of values through every proxy, which is very slow.
const chartData = shallowRef<ChartData<'line'>>({ labels: [], datasets: [] })
const minPerUnit = ref<{ [key: string]: number }>({})
const maxPerUnit = ref<{ [key: string]: number }>({})

function channelOf(slot: TSlot): LiveChannel | undefined {
  return props.channels.find(channel => channel.slot === slot)
}

function refresh() {
  updateChartData(
    props.frames,
    chartData as Ref<ChartData>,
    {
      first: channelOf('first') !== undefined,
      second: channelOf('second') !== undefined,
      third: channelOf('third') !== undefined
    },
    props.drawIft,
    props.maxPoints,
    toRef(props, 'ift') as Ref<Array<TPoint>>,
    {
      first: channelOf('first')?.label || 'First Channel',
      second: channelOf('second')?.label || 'Second Channel',
      third: channelOf('third')?.label || 'Third Channel',
      ift: props.iftLabel
    },
    {
      first: channelOf('first')?.unit ?? '',
      second: channelOf('second')?.unit ?? '',
      third: channelOf('third')?.unit ?? ''
    },
    props.sampleRate,
    props.drawTime,
    minPerUnit,
    maxPerUnit
  )
}

watch(() => props.version, refresh)
watch(() => props.resetToken, () => {
  minPerUnit.value = {}
  maxPerUnit.value = {}
  chartData.value = { labels: [], datasets: [] }
})

// One axis for every physical unit that is shown
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const scales = computed<Record<string, any>>(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {}
  props.channels.forEach(channel => {
    if(channel.unit in result) return
    result[channel.unit] = {
      position: 'left',
      type: 'linear',
      // @ts-ignore
      title: {
        display: true,
        text: `${channel.dimension} in ${channel.unit}`,
      },
      min: minPerUnit.value[channel.unit] ?? -10,
      max: maxPerUnit.value[channel.unit] ?? 10,
    }
  })
  return result
})
</script>

<template>
  <StreamingChart
    :data="chartData"
    :boundaries="boundaries"
    :scales="scales"
  />
</template>
