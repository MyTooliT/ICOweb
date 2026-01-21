import {
  MeasurementDataFrame,
  TWebSocketState
} from '@/stores/measurementStore/measurementStore.ts';
import {
  ref,
  Ref
} from 'vue';
import { getWSLink } from '@/api/icoapi.ts';

export type TPoint = {
  x: number,
  y: number
}

export function useMeasurementWebsocket(
  shouldUpdate: boolean = false,
  update: () => void = () => {},
  onClose: () => Promise<void> = () => new Promise((resolve) => resolve())
): {
  open: () => void,
  close: () => void,
  ws: Ref<WebSocket | undefined>,
  state: Ref<TWebSocketState>,
  storage: Ref<Array<MeasurementDataFrame>>,
  ift_storage: Ref<Array<TPoint>>,
  dataloss: Ref<number | undefined>
} {
  const ws = ref<WebSocket | undefined>(undefined)
  const state = ref<TWebSocketState>('closed')
  const storage = ref<Array<MeasurementDataFrame>>([])
  const ift_storage : Ref<Array<TPoint>> = ref([])
  const dataloss: Ref<number | undefined> = ref(undefined)
  let intervalId: number | undefined = undefined

  function open(): void {
    state.value = 'connecting'
    const ws_base = getWSLink()

    ws.value = new WebSocket(
      `${ws_base}/measurement/stream`
    )

    ws.value.onopen = () => {
      state.value = 'open'
      storage.value = []
      ift_storage.value = []
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
        parsed.forEach((entry: MeasurementDataFrame) => {
          if(entry.dataloss) {
            dataloss.value = entry.dataloss
          }
          else if(entry.ift) {
            ift_storage.value = [...entry.ift]
          }
          else {
            storage.value.push(entry)
          }
        })
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
    ws,
    state,
    storage,
    ift_storage,
    dataloss
  }
}