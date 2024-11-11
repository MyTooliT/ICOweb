import {
  TChannelsActive,
  TMeasurementDataFrame
} from '@/stores/measurementStore/measurementStore.ts';
import { TPoint } from '@/utils/useMeasurementWebSocket.ts';
import {
  ChartData,
  ChartDataSets
} from 'chart.js';
import { Ref } from 'vue';


export function updateChartData(
  rawData: Array<TMeasurementDataFrame>,
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
  },
  sampleRate: number = 3175,
  acquisitionTime: number = 10,
  minRef: Ref<number | undefined>,
  maxRef: Ref<number | undefined>
): void {

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
    const values: number[] = []

    if(rawData[i].first) {
      y_values_visible.first.push(<number>rawData[i].first)
      values.push(<number>rawData[i].first)
    }
    if(rawData[i].second) {
      y_values_visible.second.push(<number>rawData[i].second)
      values.push(<number>rawData[i].second)
    }
    if(rawData[i].third) {
      y_values_visible.third.push(<number>rawData[i].third)
      values.push(<number>rawData[i].third)
    }

    if(minRef.value) {
      minRef.value = Math.min(...values, minRef.value)
    } else {
      minRef.value = Math.min(...values)
    }
    if(maxRef.value) {
      maxRef.value = Math.max(...values, maxRef.value)
    } else {
      maxRef.value = Math.max(...values)
    }
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