import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MeasurementDataFrame } from '@/stores/measurementStore/measurementStore.ts'

vi.mock('@/api/icoapi.ts', () => ({
  getWSLink: () => 'ws://test/api/v1'
}))

import {
  appendBounded,
  DEFAULT_SOURCE,
  useMeasurementWebsocket
} from '@/utils/useMeasurementWebSocket.ts'

let socket: FakeWebSocket
class FakeWebSocket {
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  constructor(public url: string) {
    socket = this
  }
  close() {}
  dispatchEvent() { return true }
  receive(frames: Array<Partial<MeasurementDataFrame>>) {
    this.onmessage?.({ data: JSON.stringify(frames) })
  }
}

function frame(timestamp: number, extra: Partial<MeasurementDataFrame> = {}): MeasurementDataFrame {
  return {
    first: 1, second: null, third: null, ift: null,
    timestamp, counter: 0, dataloss: null, ...extra
  }
}

describe('appendBounded', () => {
  it('keeps everything below the limit', () => {
    const buffer: MeasurementDataFrame[] = []
    appendBounded(buffer, [frame(0), frame(1), frame(2)], 10)
    expect(buffer.map(f => f.timestamp)).toEqual([0, 1, 2])
  })

  it('drops the oldest frames above the limit', () => {
    const buffer: MeasurementDataFrame[] = []
    for (let i = 0; i < 1000; i++) appendBounded(buffer, [frame(i)], 100)
    // Cut at a quarter above the limit, back to the limit
    expect(buffer.length).toBeLessThanOrEqual(125)
    expect(buffer.length).toBeGreaterThanOrEqual(100)
    // The newest frames are the ones that are kept
    expect(buffer[buffer.length - 1].timestamp).toBe(999)
    expect(buffer[0].timestamp).toBeGreaterThanOrEqual(1000 - 125)
  })
})

describe('useMeasurementWebsocket', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function opened(maxFrames = () => 1000) {
    const stream = useMeasurementWebsocket(false, () => {}, undefined, maxFrames)
    stream.open()
    socket.onopen?.()
    return stream
  }

  it('stores frames without source under the default source', () => {
    const stream = opened()
    socket.receive([frame(0), frame(1)])

    expect(stream.sources.value).toEqual([DEFAULT_SOURCE])
    expect(stream.storage.value.map(f => f.timestamp)).toEqual([0, 1])
  })

  it('keeps the frames of every source apart', () => {
    const stream = opened()
    socket.receive([
      frame(0, { source: 'A' }), frame(0, { source: 'B' }),
      frame(1, { source: 'A' })
    ])

    expect(stream.sources.value).toEqual(['A', 'B'])
    expect(stream.storages.value['A']).toHaveLength(2)
    expect(stream.storages.value['B']).toHaveLength(1)
    // The first source for code that knows only one
    expect(stream.storage.value).toBe(stream.storages.value['A'])
  })

  it('bounds the buffer of every source', () => {
    const stream = opened(() => 100)
    for (let i = 0; i < 2000; i++) {
      socket.receive([frame(i, { source: 'A' }), frame(i, { source: 'B' })])
    }

    for (const source of ['A', 'B']) {
      const frames = stream.storages.value[source]
      expect(frames.length).toBeLessThanOrEqual(125)
      expect(frames[frames.length - 1].timestamp).toBe(1999)
    }
  })

  it('uses the current limit', () => {
    let limit = 1000
    const stream = opened(() => limit)
    for (let i = 0; i < 400; i++) socket.receive([frame(i)])
    expect(stream.storage.value).toHaveLength(400)

    limit = 100
    socket.receive([frame(400)])
    expect(stream.storage.value.length).toBeLessThanOrEqual(125)
  })

  it('does not store messages that only report the data loss', () => {
    const stream = opened()
    socket.receive([
      frame(0, { source: 'A' }),
      { first: null, second: null, third: null, ift: null,
        timestamp: null as any, counter: null as any, dataloss: 0.25, source: 'A' }
    ])

    expect(stream.storage.value).toHaveLength(1)
    expect(stream.datalossBySource.value).toEqual({ A: 0.25 })
  })

  it('reports the worst data loss of all sources', () => {
    const stream = opened()
    expect(stream.dataloss.value).toBeUndefined()
    socket.receive([
      { dataloss: 0.01, source: 'A', timestamp: null as any },
      { dataloss: 0.2, source: 'B', timestamp: null as any }
    ])
    expect(stream.dataloss.value).toBe(0.2)
    socket.receive([{ dataloss: 0, source: 'B', timestamp: null as any }])
    expect(stream.dataloss.value).toBe(0.01)
  })

  it('keeps IFT values out of the data', () => {
    const stream = opened()
    socket.receive([frame(1, { ift: [{ x: 1, y: 2 }] }), frame(2)])

    expect(stream.ift_storage.value).toEqual([{ x: 1, y: 2 }])
    expect(stream.storage.value.map(f => f.timestamp)).toEqual([2])
  })

  it('starts over when the stream is opened again', () => {
    const stream = opened()
    socket.receive([frame(0, { source: 'A', dataloss: 0.5 })])
    stream.open()
    socket.onopen?.()

    expect(stream.sources.value).toEqual([])
    expect(stream.dataloss.value).toBeUndefined()
  })
})

describe('stream settings', () => {
  it('asks ICOapi for the live rate and the updates', () => {
    const urls: string[] = []
    class Socket { constructor(url: string) { urls.push(url) } close() {} dispatchEvent() {} }
    vi.stubGlobal('WebSocket', Socket)
    const { open } = useMeasurementWebsocket(
      false, () => {}, async () => {}, () => 100, () => ({ rate: 60, updates: 30 })
    )
    open()
    expect(urls[0]).toMatch(/\/measurement\/stream\?rate=60&updates=30$/)
  })

  it('sends no query without settings (one unit)', () => {
    const urls: string[] = []
    class Socket { constructor(url: string) { urls.push(url) } close() {} dispatchEvent() {} }
    vi.stubGlobal('WebSocket', Socket)
    const { open } = useMeasurementWebsocket(false)
    open()
    expect(urls[0]).toMatch(/\/measurement\/stream$/)
  })
})
