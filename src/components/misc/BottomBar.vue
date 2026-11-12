<script setup lang="ts">
import { resetCAN } from '@/api/icoapi.ts';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import BaseBottomBar, { State } from '@base/components/bottom/BottomBar.vue';
import Button from 'primevue/button';
import { computed, onMounted } from 'vue';

const store = useGeneralStore();

onMounted(async () => {
  await store.systemState.checkState()
})

function clearCache() {
  window?.localStorage?.clear()
}

const { loading, call: resetHandle } = useLoadingHandler(resetCAN)

const state = computed<State>(() => {
  const system = store.systemState
  if (!system.reachable) return State.ERROR
  if (system.canStatus === 'ERROR') return State.ERROR
  if (system.running) return State.ACTIVE
  if (system.canConnected) return State.IDLE
  return State.WARNING
})

const stateClassMap: Record<State, string> = {
  [State.ERROR]: 'bg-error-container text-on-error-container',
  [State.WARNING]: 'bg-primary text-on-primary',
  [State.IDLE]: 'bg-primary-container text-on-primary-container',
  [State.ACTIVE]: 'bg-secondary text-on-secondary'
}

const canStatusText = computed<string>(() => {
  const system = store.systemState
  switch (system.canStatus) {
    case 'CONNECTED': {
      const network = system.canSelected
      return network ? `connected (${network.interface}:${network.channel})` : 'connected'
    }
    case 'CONNECTING': return 'connecting...'
    case 'NETWORK_FOUND': return 'network found'
    case 'ERROR': return 'error'
    default: return 'no network'
  }
})

const statusInfos = computed(() => {
  const system = store.systemState
  const infos = [
    {
      name: 'API',
      status: system.reachable ? 'reachable' : 'disconnected'
    },
    {
      name: 'CAN',
      status: canStatusText.value
    }
  ]
  if (system.canStatus === 'CONNECTED') {
    infos.push({
      name: 'STU',
      status: system.stuConnected ? 'responsive' : 'not responsive'
    })
  }
  return infos
})
</script>

<template>
  <BaseBottomBar
    :state="state"
    :state-class-map="stateClassMap"
    :status-infos="statusInfos"
  >
    <template #left>
      <div class="bg-inherit text-inherit">
        <Button
          label="Clear Cache"
          size="small"
          link
          class="!text-inherit"
          @click="clearCache()" />
        <Button
          v-if="!store.systemState.running"
          label="Reconnect CAN"
          size="small"
          link
          :loading="loading"
          :disabled="loading || store.systemState.canStatus !== 'CONNECTED'"
          class="!text-inherit"
          @click="resetHandle" />
      </div>
    </template>
    <div
      v-if="store.systemState.running"
      class="text-sm h-min flex self-center">
      Ongoing Measurement
    </div>
  </BaseBottomBar>
</template>
