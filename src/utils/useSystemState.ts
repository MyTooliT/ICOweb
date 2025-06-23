import { getWSLink } from '@/api/icoapi.ts';
import { MeasurementStatus } from '@/client';
import {computed, ref} from 'vue';

export function useSystemState(
    onCustomInstruction: (event: any) => void = (event: any) => {
      console.log('[WS] Received custom instruction', event.data);
    },
) {
  const reachable = ref(false);
  const canReady = ref(false);
  const running = ref(false);
  const measurementStatus = ref<MeasurementStatus | null>(null);
  const cloud_ready = ref(false);

  let ws: WebSocket | null = null;
  let intervalID = 0;
  let retryTimer: number | null = null;

  const hasWS = computed<boolean>(() => {
    return ws !== null;
  })

  function connectWebSocket(retries = 10, delay = 1000) {
    try {
      ws = new WebSocket(`${getWSLink()}/state`);

      ws.onopen = () => {
        console.log('[WS] Connected');
        try {
          ws?.send(JSON.stringify({
            message: 'local_storage_state',
            data: {
              hardware: JSON.parse(localStorage.getItem('hardware') ?? '{}'),
              measurement: JSON.parse(localStorage.getItem('measurement') ?? '{}'),
            }
          }))
        } catch(e) {

        }
      };

      ws.onmessage = (event: any) => {
        try {
          const parsed = JSON.parse(event.data)
          switch (parsed.message) {
            case 'local_storage_state':
              // This could one day sync local state between clients
              /*const saved_storage = JSON.parse(parsed.data)
              Object.keys(saved_storage).forEach((key) => {
                localStorage.setItem(key, saved_storage[key])
              })*/
              break;

            case 'state':
              reachable.value = true;
              canReady.value = parsed.data.can_ready;
              running.value = parsed.data.measurement_status.running;
              measurementStatus.value = parsed.data.measurement_status;
              cloud_ready.value = parsed.data.cloud_status
              break;

            default:
              onCustomInstruction(parsed)
              break;
          }
        } catch (e) {
          // If it fails, it is a custom instruction
          console.log('[WS] Received custom instruction', event.data);
          onCustomInstruction(event);
        }
      };

      ws.onerror = (event: any) => {
        console.log('[WS] Error', event);
      };

      ws.onclose = (event: any) => {
        console.log('[WS] Closed', event);
        reachable.value = false;
        canReady.value = false;
        running.value = false;
        cloud_ready.value = false;

        // Retry logic
        if (retries > 0) {
          console.log(`[WS] Retrying in ${delay}ms...`);
          retryTimer = window.setTimeout(() => connectWebSocket(retries - 1, delay), delay);
        }
      };
    } catch (e) {
      console.log('[WS] Failed to connect', e);
      if (retries > 0) {
        retryTimer = window.setTimeout(() => connectWebSocket(retries - 1, delay), delay);
      }
    }
  }

  async function checkState(): Promise<void> {
    try {
      ws?.send(JSON.stringify({
        message: 'get_state'
      }));
      reachable.value = true;
    } catch (e) {
      reachable.value = false;
      canReady.value = false;
      running.value = false;
      cloud_ready.value = false;
    }
  }

  function registerInterval(timeout_ms: number) {
    if (!window) throw new Error('useSystemState needs the <window> object');
    intervalID = window.setInterval(async () => checkState(), timeout_ms);
  }

  function deregisterInterval() {
    if (!window) throw new Error('useSystemState needs the <window> object');
    if (intervalID !== 0) window.clearInterval(intervalID);
    if (retryTimer) window.clearTimeout(retryTimer);
    if (ws) ws.close();
  }

  // Immediately try to connect
  connectWebSocket();

  return {
    reachable,
    canReady,
    running,
    measurementStatus,
    checkState,
    registerInterval,
    deregisterInterval,
    hasWS,
    connectWebSocket,
    cloud_ready
  };
}
