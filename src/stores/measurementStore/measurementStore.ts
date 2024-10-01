import {
  ChartData,
  ChartDataSets
} from 'chart.js';
import { defineStore } from 'pinia';
import {
  computed,
  Ref,
  ref
} from 'vue';

export type TParsedData = {
  first: number | null,
  second: number | null,
  third: number | null,
  ift: Array<{x: number, y: number}> | null
  timestamp: number,
  counter: number
}

export type TWSState = 'open' | 'closed' | 'connecting'

export const measurementChannels = ['first', 'second', 'third'] as const

export type TChannelMap = {
  [K in typeof measurementChannels[number]]: number
}

export const useMeasurementStore = defineStore('measurement', () => {
  const parsedData: Array<TParsedData> = []
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
    IFTRequested
  }
}, {
  persist: true
})

type TChannelsActive = {
  first: boolean,
  second: boolean,
  third: boolean
}

export function useMeasurementWebsocket(
  shouldUpdate: boolean = false,
  update: () => void = () => {}
): {
  open: () => void,
  close: () => void,
  ws: Ref<WebSocket | undefined>,
  state: Ref<TWSState>,
  storage: Ref<Array<TParsedData>>,
} {
  const ws = ref<WebSocket | undefined>(undefined)
  const state = ref<TWSState>('closed')
  const storage = ref<Array<TParsedData>>([])
  let intervalId: number | undefined = undefined

  function open(): void {
    state.value = 'connecting'
    const protocol = import.meta.env.VITE_API_WS_PROTOCOL;
    const hostname = import.meta.env.VITE_API_HOSTNAME;
    const port = import.meta.env.VITE_API_PORT;
    const prefix = import.meta.env.VITE_API_WS_PREFIX;

    ws.value = new WebSocket(
      `${protocol}://${hostname}:${port}/${prefix}/measure`
    )

    ws.value.onopen = () => {
      state.value = 'open'
      storage.value = []
      ws.value?.dispatchEvent(new Event('opened'))
    }

    ws.value.onerror = () => {
      state.value = 'closed'
    }

    ws.value.onclose = () => {
      close()
    }

    ws.value.onmessage = (event: any) => {
      storage.value.push(JSON.parse(event.data) as TParsedData)
    }

    if(shouldUpdate) {
      intervalId = window.setInterval(update, 1/10)
    }
  }

  function close() {
    if(ws.value) {
      ws.value.close()
      state.value = 'closed'
    }
    if(intervalId) {
      window.clearInterval(intervalId)
    }
  }

  return {
    open,
    close,
    ws,
    state,
    storage
  }

}

// eslint-disable-next-line max-len
export function updateChartData(rawData: Array<TParsedData>, chartData: Ref<ChartData<'line'>>, activeChannels: TChannelsActive, drawIFT: boolean = false, drawIncrement: number = 10): void {
  let start = 0
  const x_values: number[] = []
  type TYValues = {
    first: number[],
    second: number[],
    third: number[]
  }
  const y_values: TYValues = {
    first: [],
    second: [],
    third: []
  }
  const x_values_visible: number[] = []
  const y_values_visible: TYValues = {
    first: [],
    second: [],
    third: []
  }

  const ift_data: Array<{x: number, y: number}> = []
  const ift_data_visible: Array<{x: number, y: number}> = []

  for(let i = 0; i < rawData.length; i++) {
    if(i === 0) {
      start = rawData[i].timestamp
      x_values.push(0)
    } else {
      x_values.push(rawData[i].timestamp - start)
    }
    if(rawData[i].first) { y_values.first.push(<number>rawData[i].first) }
    if(rawData[i].second) { y_values.second.push(<number>rawData[i].second) }
    if(rawData[i].third) { y_values.third.push(<number>rawData[i].third) }

    if(rawData[i].ift) {
      ift_data.push(...(rawData[i].ift as Array<{x: number, y: number}>))
      for(let j = 0; j <= ift_data.length; j += drawIncrement) {
        ift_data_visible.push(ift_data[j])
      }
    }

    if(i % drawIncrement === 0) {
      x_values_visible.push(x_values[i])
      if(rawData[i].first) {
        y_values_visible.first.push(<number>rawData[i].first)
      }
      if(rawData[i].second) {
        y_values_visible.second.push(<number>rawData[i].second)
      }
      if(rawData[i].third) {
        y_values_visible.third.push(<number>rawData[i].third)
      }
    }
  }

  const datasets: Array<ChartDataSets> = []
  datasets.push({
    label: 'First Channel',
    data: y_values_visible.first,
    pointRadius: 1,
    borderColor: 'black',
  })
  if(activeChannels.second) {
    datasets.push({
      label: 'Second Channel',
      data: y_values_visible.second,
      pointRadius: 1,
      borderColor: 'red'
    })
  }
  if(activeChannels.third) {
    datasets.push({
      label: 'Third Channel',
      data: y_values_visible.third,
      pointRadius: 1,
      borderColor: 'green'
    })
  }
  if(drawIFT) {
    datasets.push({
      label: 'IFT',
      data: ift_data,
      backgroundColor: '#006599',
      borderColor: '#006599',
      pointRadius: 1,
      showLines: true
    })
  }
  chartData.value = {
    labels: x_values_visible,
    datasets: [...datasets]
  }
}