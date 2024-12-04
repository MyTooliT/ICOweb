import { ping } from '@/api/requests';
import { APIStateModel } from '@/client';
import { ref } from 'vue';

export function useAPIState() {
  const reachable = ref<boolean>(false);
  const canReady = ref<boolean>(false);

  let intervalID = 0;

  async function checkState(): Promise<void> {
    try {
      const response = await ping() as APIStateModel
      reachable.value = true
      canReady.value = response.can_ready
    } catch(e) {
      reachable.value = false
      canReady.value = false
    }
  }

  function registerInterval(timeout_ms: number) {
    if (!window) {
      throw new Error('useAPIState needs the <window> object')
    }

    intervalID = window.setInterval(async () => checkState(), timeout_ms);
  }

  function deregisterInterval() {
    if (!window) {
      throw new Error('useAPIState needs the <window> object')
    }

    if(intervalID !== 0) {
      window.clearInterval(intervalID)
    }
  }

  return {
    reachable,
    canReady,
    checkState,
    registerInterval,
    deregisterInterval
  }
}