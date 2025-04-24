/// <reference types="chart.js" />

import {
  ActiveChannels,
  MeasurementDataFrame
} from '@/stores/measurementStore/measurementStore.ts';
import { TPoint } from '@/utils/useMeasurementWebSocket.ts';
import {
  ChartData,
  ChartDataSets
} from 'chart.js';
import { Ref } from 'vue';

/**
* Updates the given chart.js chart data structure. This is called at the WS
* helper's discretion
* @param rawData Array of measurement frames as provided by the WS
* @param chartData Vue Ref<> of the chart.js chart data structure to be updated
* @param activeChannels Which channels of the data stream are active (first, second, third)
* @param startTime Start time of measurement since Milliseconds since UNIX epoch
* @param drawIFT Indicates if the IFT value should be drawn
* @param maxNumberOfPoints Maximum points per channel that should be drawn
* @param iftValues Optional Vue Ref<> to the array of calculated IFT values
* @param channelNames Names for the to-be-drawn datasets
* @param sampleRate Acquisition sample rate of the ADC
* @param drawTime Timeframe for the chart to display
* @param minRef Vue Ref<> to the chart's minimum for setting
* @param maxRef Vue Ref<> to the chart's maximum for setting
* */
export function updateChartData(
  rawData: Array<MeasurementDataFrame>,
  chartData: Ref<ChartData<'line'>>,
  activeChannels: ActiveChannels,
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
  drawTime: number = 10,
  minRef: Ref<number | undefined>,
  maxRef: Ref<number | undefined>
): void {
  // Arrays to hold the visible subset of each dataset and timeset
  const x_values_visible: number[] = []
  const firstChannelSubset: number[] = []
  const secondChannelSubset: number[] = []
  const thirdChannelSubset: number[] = []
  const iftChannelSubset: TPoint[] = []

  // Calculate the IFT channel subset if present
  if(iftValues?.value) {
    const interval = Math.floor(iftValues.value.length / maxNumberOfPoints)
    for(let i = 0; i < iftValues.value.length; i+=interval) {
      iftChannelSubset.push(iftValues.value[i])
    }
    const iftYValues: number[] = iftChannelSubset.map(ift => ift.y)
    if(minRef.value) {
      minRef.value = Math.min(...iftYValues, minRef.value)
    } else {
      minRef.value = Math.min(...iftYValues)
    }
    if(maxRef.value) {
      maxRef.value = Math.max(...iftYValues, maxRef.value)
    } else {
      maxRef.value = Math.max(...iftYValues)
    }
  }

  // Total amount of values to be expected within the chart display range
  // To calculate the interval in which the subset is to be drawn in
  const totalExpectedValues = sampleRate * drawTime
  const interval = Math.floor(totalExpectedValues / maxNumberOfPoints)

  // Calculate if the values have overrun the chart draw range
  // And move the starting index of the subset function like a sliding window
  const overshootInIntervalUnits = (rawData.length - totalExpectedValues) / interval
  const startIndex = rawData.length > totalExpectedValues
    ? Math.floor(overshootInIntervalUnits) * interval
    : 0

  // Take a subset of the rawData every <interval> interval to display, starting
  // at the calculated startIndex
  for(let i = startIndex; i < rawData.length; i += interval) {
    x_values_visible.push(rawData[i].timestamp)
    const values: number[] = []

    if(rawData[i].first) {
      firstChannelSubset.push(<number>rawData[i].first)
      values.push(<number>rawData[i].first)
    }
    if(rawData[i].second) {
      secondChannelSubset.push(<number>rawData[i].second)
      values.push(<number>rawData[i].second)
    }
    if(rawData[i].third) {
      thirdChannelSubset.push(<number>rawData[i].third)
      values.push(<number>rawData[i].third)
    }

    // Set the chart's max and min value references if needed
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
    data: firstChannelSubset,
    pointRadius: 1,
    borderColor: 'black',
    yAxisID: 'yFirstChannel'
  })
  if(activeChannels.second) {
    datasets.push({
      label: channelNames.second ?? 'Second Channel',
      data: secondChannelSubset,
      pointRadius: 1,
      borderColor: 'red',
      yAxisID: 'ySecondChannel'
    })
  }
  if(activeChannels.third) {
    datasets.push({
      label: channelNames.third ?? 'Third Channel',
      data: thirdChannelSubset,
      pointRadius: 1,
      borderColor: 'green',
      yAxisID: 'yThirdChannel'
    })
  }
  if(drawIFT && iftValues && iftValues.value.length > 0) {
    datasets.push({
      label: channelNames.ift ?? 'IFT',
      data: iftChannelSubset,
      backgroundColor: '#006599',
      borderColor: '#006599',
      pointRadius: 1,
      showLines: true,
      yAxisID: 'yIFT'
    })
  }
  chartData.value = {
    labels: x_values_visible,
    datasets: [...datasets]
  }
}