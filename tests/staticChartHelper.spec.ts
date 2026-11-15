import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import {
  computeOverlayChart,
  DisplayableMeasurement,
  getSubsetByTime,
  mergeSources
} from '@/components/charts/staticChartHelper.ts'

vi.mock('@/api/icoapi.ts', () => ({ getAPILink: () => 'http://test/api/v1' }))

function measurement(
  name: string, samples: number, rate: number, value: number
): DisplayableMeasurement {
  const data = Array.from({ length: samples }, (_, i) => ({ x: i / rate, y: value + i }))
  return {
    name,
    counter: [],
    timestamp: data.map(point => point.x),
    datasets: [{ name: 'Acc', data }]
  }
}

describe('mergeSources', () => {
  it('names the datasets after their source and shifts them by the offset', () => {
    const merged = mergeSources([
      { source: 'A', offset: 0, data: measurement('f', 3, 1, 0) },
      { source: 'B', offset: 0.5, data: measurement('f', 3, 1, 10) }
    ])

    expect(merged.datasets.map(set => set.name)).toEqual(['A: Acc', 'B: Acc'])
    expect(merged.datasets[0].data.map(p => p.x)).toEqual([0, 1, 2])
    expect(merged.datasets[1].data.map(p => p.x)).toEqual([0.5, 1.5, 2.5])
    // The values stay as they are
    expect(merged.datasets[1].data.map(p => p.y)).toEqual([10, 11, 12])
  })

  it('does not change the data of the sources', () => {
    const source = measurement('f', 2, 1, 0)
    mergeSources([{ source: 'A', offset: 2, data: source }])
    expect(source.datasets[0].data.map(p => p.x)).toEqual([0, 1])
  })
})

describe('getSubsetByTime', () => {
  it('looks at every dataset on its own', () => {
    const merged = mergeSources([
      { source: 'A', offset: 0, data: measurement('f', 10, 1, 0) },
      { source: 'B', offset: 0, data: measurement('f', 4, 1, 0) }
    ])

    const [a, b] = getSubsetByTime(merged, ['g', 'g'], 2, 8)
    expect(a.data?.map(p => (p as any).x)).toEqual([2, 3, 4, 5, 6, 7, 8])
    expect(b.data?.map(p => (p as any).x)).toEqual([2, 3])
  })

  it('limits the number of points', () => {
    const merged = mergeSources([
      { source: 'A', offset: 0, data: measurement('f', 10000, 1000, 0) }
    ])
    const [a] = getSubsetByTime(merged, ['g'], 0, 10, 1000)
    expect((a.data ?? []).length).toBeLessThanOrEqual(1000)
    expect((a.data ?? []).length).toBeGreaterThan(500)
  })
})

describe('computeOverlayChart', () => {
  it('shows all sources on a common time axis', () => {
    const merged = mergeSources([
      { source: 'A', offset: 0, data: measurement('f', 3, 1, 0) },
      { source: 'B', offset: 1, data: measurement('f', 3, 1, 10) }
    ])
    const data = ref<any>({ datasets: [] })
    const boundaries = ref<any>({})

    computeOverlayChart(merged, data, boundaries, ['g', 'g'])

    expect(data.value.datasets).toHaveLength(2)
    expect(boundaries.value).toEqual({ xmin: 0, xmax: 3, ymin: 0, ymax: 12 })
  })

  it('shows a part of the measurement', () => {
    const merged = mergeSources([
      { source: 'A', offset: 0, data: measurement('f', 10, 1, 0) }
    ])
    const data = ref<any>({ datasets: [] })
    const boundaries = ref<any>({})

    computeOverlayChart(merged, data, boundaries, ['g'], 4, 6)

    expect(data.value.datasets[0].data.map((p: any) => p.x)).toEqual([4, 5, 6])
    expect(boundaries.value.xmin).toBe(4)
    expect(boundaries.value.xmax).toBe(6)
  })
})
