import { getMeasurementFiles } from '@/api/requests.ts';
import { MeasurementFileDetails } from '@/client';
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

  const measurementFiles = ref<MeasurementFileDetails[]>([])
  async function getFiles(): Promise<void> {
    const files = await getMeasurementFiles()
    measurementFiles.value = [...files]
  }

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
    getFiles
  }
}, {
  persist: true
})

type TChannelsActive = {
  first: boolean,
  second: boolean,
  third: boolean
}

type TPoint = {
  x: number,
  y: number
}

export function useMeasurementWebsocket(
  shouldUpdate: boolean = false,
  update: () => void = () => {},
  onClose: () => void = () => {}
): {
  open: () => void,
  close: () => void,
  ws: Ref<WebSocket | undefined>,
  state: Ref<TWSState>,
  storage: Ref<Array<TParsedData>>,
  ift_storage: Ref<Array<TPoint>>
} {
  const ws = ref<WebSocket | undefined>(undefined)
  const state = ref<TWSState>('closed')
  const storage = ref<Array<TParsedData>>([])
  const ift_storage : Ref<Array<TPoint>> = ref([])
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
      update()
      close()
      onClose()
    }

    ws.value.onmessage = (event: any) => {
      const parsed = JSON.parse(event.data) as Array<TParsedData>
      parsed.forEach((entry: TParsedData) => {
        storage.value.push(entry)
        if(entry.ift) {
          ift_storage.value = [...entry.ift]
        }
      })
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
    storage,
    ift_storage
  }

}

// eslint-disable-next-line max-len
export function updateChartData(
  rawData: Array<TParsedData>,
  chartData: Ref<ChartData<'line'>>,
  activeChannels: TChannelsActive,
  drawIFT: boolean = false,
  maxNumberOfPoints: number = 2000,
  iftValues: Ref<Array<TPoint>> | undefined = undefined,
  channelNames: {
  first?: string,
  second?: string,
  third?: string,
  ift?: string
}, sampleRate: number = 3175,
  acquisitionTime: number = 10): void {

  type TYValues = {
    first: number[],
    second: number[],
    third: number[]
  }
  const x_values_visible: number[] = []
  const y_values_visible: TYValues = {
    first: [],
    second: [],
    third: []
  }

  const totalExpectedValues = sampleRate * acquisitionTime
  const interval = Math.ceil(totalExpectedValues / maxNumberOfPoints)

  const startTime = rawData[0] ? rawData[0].timestamp : 0

  for(let i = 0; i < rawData.length; i += interval) {
    x_values_visible.push(rawData[i].timestamp - startTime)

    if(rawData[i].first) { y_values_visible.first.push(<number>rawData[i].first) }
    if(rawData[i].second) { y_values_visible.second.push(<number>rawData[i].second) }
    if(rawData[i].third) { y_values_visible.third.push(<number>rawData[i].third) }
  }

  const datasets: Array<ChartDataSets> = []
  datasets.push({
    label: channelNames.first ?? 'First Channel',
    data: y_values_visible.first,
    pointRadius: 1,
    borderColor: 'black',
  })
  if(activeChannels.second) {
    datasets.push({
      label: channelNames.second ?? 'Second Channel',
      data: y_values_visible.second,
      pointRadius: 1,
      borderColor: 'red'
    })
  }
  if(activeChannels.third) {
    datasets.push({
      label: channelNames.third ?? 'Third Channel',
      data: y_values_visible.third,
      pointRadius: 1,
      borderColor: 'green'
    })
  }
  if(drawIFT && iftValues && iftValues.value.length > 0) {
    datasets.push({
      label: channelNames.ift ?? 'IFT',
      data: iftValues.value,
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