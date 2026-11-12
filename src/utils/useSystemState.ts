import { getSystemState, getWSLink } from '@/api/icoapi.ts';
import {
  CANNetwork, CANStatus, ConnectedSTHModel, Feature, MeasurementStatus,
  SystemStateModel
} from '@/client';
import {computed, ref} from 'vue';

export function useSystemState(
    onCustomInstruction: (event: any) => void = (event: any) => {
      console.log('[WS] Received custom instruction', event.data);
    },
) {
  const reachable = ref(false);
  const canNetworkFound = ref(false);
  const stuConnected = ref(false);
  const canStatus = ref<CANStatus>('NO_NETWORK');
  const canNetworks = ref<CANNetwork[]>([]);
  const canSelected = ref<CANNetwork | null>(null);
  const canError = ref<string | null>(null);
  // The API is the source of truth for the connected sensor device, since the
  // page loses its own knowledge about it on reload
  const sthConnected = ref<ConnectedSTHModel | null>(null);
  const running = ref(false);
  const measurementStatus = ref<MeasurementStatus | null>(null);
  const cloud = ref<Feature>({
    enabled: false,
    healthy: false,
    manage_url: null
  });

  let ws: WebSocket | null = null;
  let intervalID = 0;
  let retryTimer: number | null = null;
  // Number of state updates pushed via WebSocket so far
  let pushedStateCount = 0;

  // The API is connected to a CAN network and the STU answered
  const canConnected = computed<boolean>(() => {
    return canStatus.value === 'CONNECTED' && stuConnected.value;
  })

  function resetCANState() {
    canNetworkFound.value = false;
    stuConnected.value = false;
    canStatus.value = 'NO_NETWORK';
    canNetworks.value = [];
    canSelected.value = null;
    canError.value = null;
    sthConnected.value = null;
  }

  const hasWS = computed<boolean>(() => {
    return ws !== null;
  })

  function applyState(state: SystemStateModel) {
    reachable.value = true;
    canNetworkFound.value = state.can_network_found;
    stuConnected.value = state.stu_connected;
    canStatus.value = state.can_status;
    canNetworks.value = state.can_networks ?? [];
    canSelected.value = state.can_selected ?? null;
    canError.value = state.can_error ?? null;
    sthConnected.value = state.sth_connected ?? null;
    running.value = state.measurement_status.running;
    measurementStatus.value = state.measurement_status;
    cloud.value = state.cloud
  }

  function connectWebSocket(retries = 10, delay = 1000) {
    try {
      ws = new WebSocket(`${getWSLink()}/state`);

      ws.onopen = () => {
        console.log('[WS] Connected');
      };

      ws.onmessage = (event: any) => {
        try {
          const parsed = JSON.parse(event.data)
          switch (parsed.message) {
            case 'state':
              pushedStateCount++;
              applyState(parsed.data);
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
        resetCANState();
        running.value = false;
        cloud.value = {
          enabled: false,
          healthy: false
        };

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
    const pushedBefore = pushedStateCount;
    try {
      const state = await getSystemState();
      if (pushedBefore === pushedStateCount) {
        applyState(state);
      } else {
        // A more recent state was pushed while waiting for the response
        reachable.value = true;
      }
    } catch (e) {
      reachable.value = false;
      resetCANState();
      running.value = false;
      cloud.value = {
        enabled: false,
        healthy: false
      };
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
    canNetworkFound,
    stuConnected,
    canStatus,
    canNetworks,
    canSelected,
    canError,
    sthConnected,
    canConnected,
    running,
    measurementStatus,
    checkState,
    registerInterval,
    deregisterInterval,
    hasWS,
    connectWebSocket,
    cloud
  };
}
