/// <reference types="chart.js" />
import {
  ActiveChannels,
  MeasurementDataFrame
} from '@/stores/measurementStore/measurementStore.ts';
import { TPoint } from '@/utils/useMeasurementWebSocket.ts';
import {ChartData} from 'chart.js';
import * as Chart from 'chart.js';
import { Ref } from 'vue';

/**
* Updates the given chart.js chart data structure. This is called at the WS
* helper's discretion
* @param rawData Array of measurement frames as provided by the WS
* @param chartData Vue Ref<> of the chart.js chart data structure to be updated
* @param activeChannels Which channels of the data stream are active (first, second, third)
* @param drawIFT Indicates if the IFT value should be drawn
* @param maxNumberOfPoints Maximum points per channel that should be drawn
* @param iftValues Optional Vue Ref<> to the array of calculated IFT values
* @param channelNames Names for the to-be-drawn datasets
* @param channelUnits Units for the to-be-drawn datasets
* @param sampleRate Acquisition sample rate of the ADC
* @param drawTime Timeframe for the chart to display
* @param minRefPerUnit Vue Ref<> to the chart's minimum for setting
* @param maxRefPerUnit Vue Ref<> to the chart's maximum for setting
* */
export function updateChartData(
  rawData: Array<MeasurementDataFrame>,
  chartData: Ref<ChartData>,
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
  channelUnits: {
    first: string,
    second: string,
    third: string,
  },
  sampleRate: number = 3175,
  drawTime: number = 10,
  minRefPerUnit: Ref<{[key: string] : number}>,
  maxRefPerUnit: Ref<{[key: string] : number}>
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
  }

  // Total count of values to be expected within the chart display range
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
  // Range of every channel. Note: Do not spread the (growing) subset into
  // `Math.min` for every point: that is quadratic and made the chart the
  // slowest part of the page.
  const ranges = {
    first: { min: Infinity, max: -Infinity },
    second: { min: Infinity, max: -Infinity },
    third: { min: Infinity, max: -Infinity }
  }
  const subsets = {
    first: firstChannelSubset,
    second: secondChannelSubset,
    third: thirdChannelSubset
  }
  const slots = ['first', 'second', 'third'] as const
  for(let i = startIndex; i < rawData.length; i += interval) {
    const frame = rawData[i]
    x_values_visible.push(frame.timestamp)
    for(const slot of slots) {
      const value = frame[slot]
      if(!value) continue
      subsets[slot].push(<number>value)
      if(value < ranges[slot].min) ranges[slot].min = value
      if(value > ranges[slot].max) ranges[slot].max = value
    }
  }
  for(const slot of slots) {
    if(subsets[slot].length === 0) continue
    const unit = channelUnits[slot]
    minRefPerUnit.value[unit] = Math.min(
      ranges[slot].min, minRefPerUnit.value[unit] ?? Number.MAX_SAFE_INTEGER)
    maxRefPerUnit.value[unit] = Math.max(
      ranges[slot].max, maxRefPerUnit.value[unit] ?? Number.MIN_SAFE_INTEGER)
  }

  const datasets: Array<Chart.ChartDataset> = []
  datasets.push({
    label: channelNames.first ?? 'First Channel',
    data: firstChannelSubset,
    pointRadius: 1,
    borderColor: 'black',
    yAxisID: channelUnits.first
  })
  if(activeChannels.second) {
    datasets.push({
      label: channelNames.second ?? 'Second Channel',
      data: secondChannelSubset,
      pointRadius: 1,
      borderColor: 'red',
      yAxisID: channelUnits.second
    })
  }
  if(activeChannels.third) {
    datasets.push({
      label: channelNames.third ?? 'Third Channel',
      data: thirdChannelSubset,
      pointRadius: 1,
      borderColor: 'green',
      yAxisID: channelUnits.third
    })
  }
  if(drawIFT && iftValues && iftValues.value.length > 0) {
    datasets.push({
      label: channelNames.ift ?? 'IFT',
      data: iftChannelSubset,
      backgroundColor: '#006599',
      borderColor: '#006599',
      pointRadius: 1,
      showLine: true,
      yAxisID: 'yIFT'
    })
  }
  chartData.value = {
    labels: x_values_visible,
    datasets: [...datasets]
  }
}