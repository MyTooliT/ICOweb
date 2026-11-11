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
  if (store.systemState.running) return State.ACTIVE
  if (store.systemState.canReady) return State.IDLE
  if (store.systemState.reachable) return State.WARNING
  return State.ERROR
})

const stateClassMap: Record<State, string> = {
  [State.ERROR]: 'bg-error-container text-on-error-container',
  [State.WARNING]: 'bg-primary text-on-primary',
  [State.IDLE]: 'bg-primary-container text-on-primary-container',
  [State.ACTIVE]: 'bg-secondary text-on-secondary'
}

const statusInfos = computed(() => [
  {
    name: 'API',
    status: store.systemState.reachable ? 'reachable' : 'disconnected'
  },
  {
    name: 'CAN',
    status: store.systemState.canReady ? 'established' : 'disconnected'
  }
])
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
          label="Reset CAN Network"
          size="small"
          link
          :loading="loading"
          :disabled="loading"
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
