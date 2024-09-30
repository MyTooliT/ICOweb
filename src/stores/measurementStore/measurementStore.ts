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

  return {
    parsedData,
    parsedDataWrapper,
    continuous,
    acquisitionTime,
    chartData,
    chartDataWrapper,
    selectedChannels,
    activeChannels
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
export function updateChartData(rawData: Array<TParsedData>, chartData: Ref<ChartData<'line'>>, activeChannels: TChannelsActive, drawIncrement: number = 10, window: number = 50): void {
  console.log(activeChannels);
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

  for(let i = 0; i < rawData.length; i++) {
    if(i === 0) {
      start = rawData[i].timestamp
      x_values.push(0)
    } else {
      x_values.push(rawData[i].timestamp - start)
    }
    y_values.first.push(rawData[i].first)
    y_values.second.push(rawData[i].second)
    y_values.third.push(rawData[i].third)

    if(i % drawIncrement === 0) {
      x_values_visible.push(x_values[i])
      y_values_visible.first.push(rawData[i].first)
      y_values_visible.second.push(rawData[i].second)
      y_values_visible.third.push(rawData[i].third)
    }
  }

  const datasets: Array<ChartDataSets> = []
  datasets.push({
    label: 'First Channel',
    data: y_values_visible.first,
    pointRadius: 1,
    borderColor: 'blue'
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
  chartData.value = {
    labels: x_values_visible,
    datasets: [...datasets]
  }
}