import {getWSLink} from '@/api/icoapi.ts';
import {MeasurementStatus, SystemStateModel} from '@/client';
import { ref } from 'vue';

export function useSystemState() {
  const reachable = ref<boolean>(false);
  const canReady = ref<boolean>(false);
  const running = ref<boolean>(false);
  const measurementStatus = ref<MeasurementStatus | null>(null);
  const ws = new WebSocket(`${getWSLink()}/state`);
  let intervalID = 0;

  ws.onmessage = (event: any) => {
    try {
      const parsed = JSON.parse(event.data) as SystemStateModel
      reachable.value = true
      canReady.value = parsed.can_ready
      running.value = parsed.measurement_status.running
      measurementStatus.value = parsed.measurement_status
    }
    catch(e) {
      console.log(e)
    }
  }

  ws.onerror = (event: any) => {
    console.log(event)
  }

  ws.onclose = (event: any) => {
    console.log(event)
  }

  async function checkState(): Promise<void> {
    try {
        ws.send('get_state')
        reachable.value = true
    } catch(e) {
      reachable.value = false
      canReady.value = false
      running.value = false
    }
  }

  function registerInterval(timeout_ms: number) {
    if (!window) {
      throw new Error('useSystemState needs the <window> object')
    }

    intervalID = window.setInterval(async () => checkState(), timeout_ms);
  }

  function deregisterInterval() {
    if (!window) {
      throw new Error('useSystemState needs the <window> object')
    }

    if(intervalID !== 0) {
      window.clearInterval(intervalID)
    }
  }

  return {
    reachable,
    canReady,
    running,
    measurementStatus,
    checkState,
    registerInterval,
    deregisterInterval
  }
}