import {
  MeasurementDataFrame,
  TWebSocketState
} from '@/stores/measurementStore/measurementStore.ts';
import {
  computed,
  ComputedRef,
  ref,
  Ref,
  shallowRef,
  ShallowRef,
  triggerRef
} from 'vue';
import { getWSLink } from '@/api/icoapi.ts';

export type TPoint = {
  x: number,
  y: number
}

/**
 * Name under which frames without `source` are stored. The API only names the
 * source of a frame with multi STU support.
 */
export const DEFAULT_SOURCE = ''

/** Frames kept per source, if the caller does not say otherwise */
export const DEFAULT_MAX_FRAMES = 100_000

/**
 * Add frames to the buffer of a source and drop the oldest ones, if there are
 * more than `maxFrames`.
 *
 * The buffer may grow by a quarter before it is cut, so that frames are not
 * removed from the front on every message.
 *
 * @param buffer The frames of the source
 * @param frames The new frames
 * @param maxFrames The number of frames that are kept
 */
export function appendBounded(
  buffer: Array<MeasurementDataFrame>,
  frames: Array<MeasurementDataFrame>,
  maxFrames: number
): void {
  for(const frame of frames) {
    buffer.push(frame)
  }
  if(buffer.length > maxFrames * 1.25) {
    buffer.splice(0, buffer.length - maxFrames)
  }
}

export function useMeasurementWebsocket(
  shouldUpdate: boolean = false,
  update: () => void = () => {},
  onClose: () => Promise<void> = () => new Promise((resolve) => resolve()),
  maxFrames: () => number = () => DEFAULT_MAX_FRAMES,
  /** What ICOapi should send (query of the stream), see `/measurement/stream` */
  liveSettings: () => { rate?: number, updates?: number } = () => ({})
): {
  open: () => void,
  close: () => void,
  clear: () => void,
  ws: Ref<WebSocket | undefined>,
  state: Ref<TWebSocketState>,
  /** Frames of the first source (all frames without multi STU support) */
  storage: ComputedRef<Array<MeasurementDataFrame>>,
  /** Frames of every source, by name of the source */
  storages: ShallowRef<Record<string, Array<MeasurementDataFrame>>>,
  /** Names of the sources in the order their first frame was received */
  sources: ComputedRef<Array<string>>,
  ift_storage: Ref<Array<TPoint>>,
  /** Worst share of lost packets of all sources */
  dataloss: ComputedRef<number | undefined>,
  datalossBySource: Ref<Record<string, number>>
} {
  const ws = ref<WebSocket | undefined>(undefined)
  const state = ref<TWebSocketState>('closed')
  // Not deeply reactive: A measurement sends thousands of frames per second.
  // The array is changed in place and `triggerRef` tells the page.
  const storages = shallowRef<Record<string, Array<MeasurementDataFrame>>>({})
  const sources = computed(() => Object.keys(storages.value))
  const storage = computed(() => storages.value[sources.value[0]] ?? [])
  const ift_storage : Ref<Array<TPoint>> = ref([])
  const datalossBySource: Ref<Record<string, number>> = ref({})
  const dataloss = computed<number | undefined>(() => {
    const values = Object.values(datalossBySource.value)
    return values.length === 0 ? undefined : Math.max(...values)
  })
  let intervalId: number | undefined = undefined

  function clear(): void {
    storages.value = {}
    ift_storage.value = []
    datalossBySource.value = {}
  }

  function open(): void {
    state.value = 'connecting'
    const ws_base = getWSLink()

    const query = Object.entries(liveSettings())
      .filter(([, value]) => value !== undefined && value > 0)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')
    ws.value = new WebSocket(
      `${ws_base}/measurement/stream${query ? `?${query}` : ''}`
    )

    ws.value.onopen = () => {
      state.value = 'open'
      clear()
      ws.value?.dispatchEvent(new Event('opened'))
    }

    ws.value.onerror = () => {
      state.value = 'closed'
    }

    ws.value.onclose = async () => {
      update()
      close()
      await onClose()
    }

    ws.value.onmessage = (event: any) => {
      try {
        const parsed = JSON.parse(event.data) as Array<MeasurementDataFrame>
        const received: Record<string, Array<MeasurementDataFrame>> = {}
        parsed.forEach((entry: MeasurementDataFrame) => {
          const source = entry.source ?? DEFAULT_SOURCE
          if(entry.dataloss !== null && entry.dataloss !== undefined) {
            datalossBySource.value = {
              ...datalossBySource.value,
              [source]: entry.dataloss
            }
          }
          if(entry.ift) {
            ift_storage.value = [...entry.ift]
            return
          }
          // Messages that only report the data loss have no values
          if(entry.timestamp === null || entry.timestamp === undefined) return
          (received[source] ??= []).push(entry)
        })
        const limit = maxFrames()
        Object.entries(received).forEach(([source, frames]) => {
          if(!(source in storages.value)) {
            storages.value = { ...storages.value, [source]: [] }
          }
          appendBounded(storages.value[source], frames, limit)
        })
        if(Object.keys(received).length > 0) triggerRef(storages)
      } catch (e) {
        console.log(e)
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
    clear,
    ws,
    state,
    storage,
    storages,
    sources,
    ift_storage,
    dataloss,
    datalossBySource
  }
}
