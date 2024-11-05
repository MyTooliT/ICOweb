import { getMeasurementFiles } from '@/api/requests.ts';
import { MeasurementFileDetails } from '@/client';
import { ChartData } from 'chart.js';
import { defineStore } from 'pinia';
import {
  computed,
  ref
} from 'vue';

export type TMeasurementDataFrame = {
  first: number | null,
  second: number | null,
  third: number | null,
  ift: Array<{x: number, y: number}> | null
  timestamp: number,
  counter: number
}

export type TWebSocketState = 'open' | 'closed' | 'connecting'

export const measurementChannels = ['first', 'second', 'third'] as const

export type TChannelMap = {
  [K in typeof measurementChannels[number]]: number
}

export type TChannelsActive = {
  first: boolean,
  second: boolean,
  third: boolean
}

export const useMeasurementStore = defineStore('measurement', () => {
  const parsedData: Array<TMeasurementDataFrame> = []
  const continuous = ref<Boolean>(false);
  const acquisitionTime = ref<number>(5)
  const selectedChannels = ref<TChannelMap>({
    first: 1,
    second: 0,
    third: 0
  })
  const activeChannels = ref<TChannelsActive>({
    first: true,
    second: false,
    third: false
  })

  const parsedDataWrapper = computed(() => {
    return parsedData
  })

  const chartData = ref<ChartData<'line'>>({
    labels: [],
    datasets: [{
      label: 'Raw Data',
      data: []
    }]
  })

  const chartDataWrapper = computed(() => {
    return chartData
  })

  const lastIFTTimestamp = ref<number>

  const IFTChannel = ref<typeof measurementChannels[number]>('first')
  const windowWidth = ref<number>(150)
  const IFTRequested = ref<boolean>(false)

  const measurementFiles = ref<MeasurementFileDetails[]>([])
  async function getFiles(): Promise<void> {
    const files = await getMeasurementFiles()
    measurementFiles.value = [...files]
  }
  const getLatestFileName = computed<string>(() => {
    if(measurementFiles.value.length === 0) return ''
    return [...measurementFiles.value].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())[0].name
  })

  return {
    parsedData,
    parsedDataWrapper,
    continuous,
    acquisitionTime,
    chartData,
    chartDataWrapper,
    selectedChannels,
    activeChannels,
    lastIFTTimestamp,
    IFTChannel,
    windowWidth,
    IFTRequested,
    measurementFiles,
    getFiles,
    getLatestFileName
  }
}, {
  persist: true
})