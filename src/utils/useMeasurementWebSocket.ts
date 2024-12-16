import {
  TMeasurementDataFrame,
  TWebSocketState
} from '@/stores/measurementStore/measurementStore.ts';
import {
  ref,
  Ref
} from 'vue';

export type TPoint = {
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
  state: Ref<TWebSocketState>,
  storage: Ref<Array<TMeasurementDataFrame>>,
  ift_storage: Ref<Array<TPoint>>,
  dataloss: Ref<number | undefined>
} {
  const ws = ref<WebSocket | undefined>(undefined)
  const state = ref<TWebSocketState>('closed')
  const storage = ref<Array<TMeasurementDataFrame>>([])
  const ift_storage : Ref<Array<TPoint>> = ref([])
  const dataloss: Ref<number | undefined> = ref(undefined)
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
      const parsed = JSON.parse(event.data) as Array<TMeasurementDataFrame>
      parsed.forEach((entry: TMeasurementDataFrame) => {
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