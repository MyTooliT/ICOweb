import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { updateChartData } from '@/components/charts/streamingChartHelper.ts'

function frames(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: i / 1000, first: i + 1, second: -(i + 1), third: null
  })) as any[]
}

function draw(data: any[], min = {}, max = {}) {
  const chartData = ref<any>({ labels: [], datasets: [] })
  const minRef = ref<{ [key: string]: number }>(min)
  const maxRef = ref<{ [key: string]: number }>(max)
  updateChartData(
    data, chartData, { first: true, second: true, third: false }, false, 1000,
    undefined, {}, { first: 'g', second: 'V', third: '' }, 1000, 10, minRef, maxRef
  )
  return { chartData, minRef, maxRef }
}

describe('updateChartData', () => {
  it('keeps the range of every unit', () => {
    const { minRef, maxRef } = draw(frames(500))
    expect(minRef.value.g).toBe(1)
    expect(maxRef.value.g).toBe(491)
    expect(minRef.value.V).toBe(-491)
    expect(maxRef.value.V).toBe(-1)
  })

  it('widens a range that is known already, never narrows it', () => {
    const { minRef, maxRef } = draw(frames(10), { g: -5 }, { g: 1000 })
    expect(minRef.value.g).toBe(-5)
    expect(maxRef.value.g).toBe(1000)
  })

  it('draws a limited number of points, also for a long measurement', () => {
    const { chartData } = draw(frames(30_000))
    expect(chartData.value.labels.length).toBeLessThanOrEqual(1100)
  })

  it('is fast enough for several charts', () => {
    const data = frames(12_500)
    const started = performance.now()
    for (let i = 0; i < 20; i++) draw(data)
    expect(performance.now() - started).toBeLessThan(150)
  })
})
