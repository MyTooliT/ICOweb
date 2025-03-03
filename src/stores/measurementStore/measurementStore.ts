import {getMeasurementFiles, getMeasurementStatus} from '@/api/requests.ts';
import {
  DiskCapacity,
  MeasurementFileDetails,
  MeasurementStatus
} from '@/client';
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
  counter: number,
  dataloss: number | null
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

export const chartDefaults = {
  xmin: 0,
  xmax: 10,
  ymin: 0,
  ymax: 10
}

export const useMeasurementStore = defineStore('measurement', () => {
  const measurementStatus = ref<MeasurementStatus>({
    name: null,
    start_time: null,
    running: false
  })
  const continuous = ref<boolean>(false)
  const acquisitionTime = ref<number>(10)
  const chartMaximumDisplayedTime = ref<number>(10)
  const chartStartTime = ref<number>(chartDefaults.xmin)
  const chartEndTime = ref<number>(chartDefaults.xmax)
  const chartYMin = ref<number>(chartDefaults.ymin)
  const chartYMax = ref<number>(chartDefaults.ymax)

  function resetChartBounds() {
    chartStartTime.value = chartDefaults.xmin
    chartEndTime.value = chartDefaults.xmax
    chartYMin.value = chartDefaults.ymin
    chartYMax.value = chartDefaults.ymax
  }

  function updateChartStartTime(startTime: number) {
    chartStartTime.value = startTime
  }

  function updateChartEndTime(endTime: number) {
    chartEndTime.value = endTime
  }

  function updateChartYMin(value: number) {
    chartYMin.value = value
  }

  function updateChartYMax(value: number) {
    chartYMax.value = value
  }

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

  const chartData = ref<ChartData<'line'>>({
    labels: [],
    datasets: [{
      label: 'Raw Data',
      data: []
    }]
  })

  const lastIFTTimestamp = ref<number>

  const IFTChannel = ref<typeof measurementChannels[number]>('first')
  const windowWidth = ref<number>(150)
  const IFTRequested = ref<boolean>(false)

  const measurementFiles = ref<MeasurementFileDetails[]>([])
  const driveCapacity = ref<DiskCapacity>({total: null, available: null})
  const measurementDirectory = ref<string>('')
  async function getFiles(): Promise<void> {
    const data = await getMeasurementFiles()
    measurementFiles.value = [...data.files]
    driveCapacity.value = {...data.capacity}
    measurementDirectory.value = data.directory
  }
  const getLatestFileName = computed<string>(() => {
    if(measurementFiles.value.length === 0) return ''
    return [...measurementFiles.value].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())[0].name
  })

  async function checkMeasurementStatus() {
    measurementStatus.value = await getMeasurementStatus()
  }

  return {
    continuous,
    acquisitionTime,
    chartData,
    updateChartStartTime,
    updateChartEndTime,
    updateChartYMin,
    updateChartYMax,
    chartStartTime,
    chartEndTime,
    chartYMin,
    chartYMax,
    chartMaximumDisplayedTime,
    selectedChannels,
    activeChannels,
    lastIFTTimestamp,
    IFTChannel,
    windowWidth,
    IFTRequested,
    measurementFiles,
    getFiles,
    getLatestFileName,
    driveCapacity,
    measurementDirectory,
    resetChartBounds,
    checkMeasurementStatus,
    measurementStatus
  }
}, {
  persist: true
})