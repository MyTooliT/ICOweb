import { floatingAverage } from '@/stores/hardwareStore/helper.ts';
import { ChartData } from 'chart.js';
import { defineStore } from 'pinia';
import {
  computed,
  Ref,
  ref
} from 'vue';

export type TParsedData = {
  value: number,
  unit: string,
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
  const acquisitionTime = ref<number>(10)
  const selectedChannels = ref<TChannelMap>({
    first: 0,
    second: 0,
    third: 0
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
    selectedChannels
  }
}, {
  persist: true
})

export function useMeasurementWebsocket(
  shouldUpdate: Boolean = false,
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
      const parsed = parseData(event.data)
      if(parsed) {
        storage.value.push(parsed)
      }
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

function parseData(raw: string): TParsedData | undefined
{
  const valueRegex = /[-+]?[0-9]*\.?[0-9]+/;
  const unitRegex = /[-+]?[0-9]*\.?[0-9]+\s([a-zA-Z_0-9]+)/;
  const timestampRegex = /@([0-9]*\.?[0-9]+)/;
  const counterRegex = /\((\d+)\)/;

  const valueMatch = raw.match(valueRegex);
  const value = valueMatch ? parseFloat(valueMatch[0]) : undefined;

  const unitMatch = raw.match(unitRegex);
  const unit = unitMatch ? unitMatch[1] : undefined;

  const timestampMatch = raw.match(timestampRegex);
  const timestamp = timestampMatch ? parseFloat(timestampMatch[1]) : undefined;

  const counterMatch = raw.match(counterRegex);
  const counter = counterMatch ? parseInt(counterMatch[1]) : undefined;

  if(value && unit && timestamp && counter) {
    return {
      value: value,
      unit: unit,
      timestamp: timestamp,
      counter: counter,
    }
  }
  return undefined
}

// eslint-disable-next-line max-len
export function updateChartData(rawData: Array<TParsedData>, chartData: Ref<ChartData<'line'>>): void {
  let start = 0
  const x = rawData.map((entry, index) => {
    if(index === 0) {
      start = entry.timestamp
      return 0
    } else {
      return entry.timestamp - start
    }
  })
  const y = rawData.map(entry => entry.value)
  chartData.value = {
    labels: x,
    datasets: [
      {
        label: 'Raw Data',
        data: y,
        pointRadius: 0
      }, {
        label: 'Floating Average',
        data: floatingAverage(y),
        backgroundColor: 'rgb(255, 0, 0)',
        pointRadius: 1
      }
    ]
  }
}