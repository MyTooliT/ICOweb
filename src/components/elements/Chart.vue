<script setup lang="ts">
import {
  ref,
  onMounted,
  computed
} from 'vue';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import {Line} from 'vue-chartjs'
import { timestamp } from '@vueuse/core';
Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend );
let ws: any = null

function parseData(raw: string): {value?: number, unit?: string, time?: number, counter?: number} {
  const valueRegex = /[-+]?[0-9]*\.?[0-9]+/;
  const unitRegex = /[-+]?[0-9]*\.?[0-9]+\s([a-zA-Z_0-9]+)/;
  const timestampRegex = /@([0-9]*\.?[0-9]+)/;
  const counterRegex = /\((\d+)\)/;

  // Extract the value
  const valueMatch = raw.match(valueRegex);
  const value = valueMatch ? parseFloat(valueMatch[0]) : undefined;

// Extract the unit
  const unitMatch = raw.match(unitRegex);
  const unit = unitMatch ? unitMatch[1] : undefined;

// Extract the timestamp
  const timestampMatch = raw.match(timestampRegex);
  const timestamp = timestampMatch ? parseFloat(timestampMatch[1]) : undefined;

// Extract the counter
  const counterMatch = raw.match(counterRegex);
  const counter = counterMatch ? parseInt(counterMatch[1]) : undefined;

  if(timestamp) {
    // timestamps.push(timestamp)
    //console.log(timestamp);
  }

  if(value) {
    // values.push(value);
    //console.log(value)
  }


  return {
    value: value,
    unit: unit,
    time: timestamp,
    counter: counter,
  }
}

const options: ChartOptions = {
  animation: false
}

const data = ref<ChartData<'line'>>({
  labels: [],
  datasets: [{
    label: 'Measurement',
    data: []
  }]
})

const x: number[] = []
const y: number[] = []
function start() {
  ws = new WebSocket('ws://localhost:8000/ws/04-0D-84-25-89-DE')
  ws.onmessage = (event: any) => {
    const { value, time } = parseData(event.data)
    if(value && time) {
      y.push(value)
      x.push(time)
    }
  }
}
function stop() {
  if(ws as WebSocket) {
    ws.close()
    ws = null
  }
}

function update() {
  data.value = {
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

function floatingAverage(arr: number[], window: number = 50): number[] {
  const avg = []
  for(let i = 0; i < arr.length - window; i++) {
    avg.push(sum(arr.slice(i, i + window)) / window);
  }
  return avg
}

function sum(arr: number[]): number {
  let acc = 0
  arr.forEach((item) => {acc += item})
  return acc
}
</script>

<template>
  <div>
    <button @click="() => start()">
      start
    </button>
    <button @click="() => stop()">
      stop
    </button>
    <button @click="() => update()">
      update
    </button>
    <div>
      <Line ref="chart" :data="data" :options="options" />
    </div>
  </div>
</template>

<style scoped>

</style>