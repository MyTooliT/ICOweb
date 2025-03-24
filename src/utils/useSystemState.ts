import { getSystemState } from '@/api/icoapi.ts';
import { MeasurementStatus } from '@/client';
import { ref } from 'vue';

export function useSystemState() {
  const reachable = ref<boolean>(false);
  const canReady = ref<boolean>(false);
  const running = ref<boolean>(false);
  const measurementStatus = ref<MeasurementStatus | null>(null);

  let intervalID = 0;

  async function checkState(): Promise<void> {
    try {
      const response = await getSystemState()
      reachable.value = true
      canReady.value = response.can_ready
      running.value = response.measurement_status.running
      measurementStatus.value = response.measurement_status
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