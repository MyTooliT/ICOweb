import { getWSLink } from '@/api/icoapi.ts';
import { MeasurementStatus, SystemStateModel } from '@/client';
import {computed, ref} from 'vue';

export function useSystemState() {
  const reachable = ref(false);
  const canReady = ref(false);
  const running = ref(false);
  const measurementStatus = ref<MeasurementStatus | null>(null);

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
      };

      ws.onmessage = (event: any) => {
        try {
          const parsed = JSON.parse(event.data) as SystemStateModel;
          reachable.value = true;
          canReady.value = parsed.can_ready;
          running.value = parsed.measurement_status.running;
          measurementStatus.value = parsed.measurement_status;
        } catch (e) {
          console.error('[WS] Parse error', e);
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
      ws?.send('get_state');
      reachable.value = true;
    } catch (e) {
      reachable.value = false;
      canReady.value = false;
      running.value = false;
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
    connectWebSocket
  };
}
