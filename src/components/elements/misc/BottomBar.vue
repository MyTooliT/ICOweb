<script setup lang="ts">
import { resetCAN } from '@/api/requests.ts';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import Button from 'primevue/button';
import {
  onBeforeUnmount,
  onMounted
} from 'vue';

const store = useGeneralStore();

onMounted(async () => {
  await store.apiState.checkState()
  store.apiState.registerInterval(5000)
})

onBeforeUnmount(() => {
  store.apiState.deregisterInterval()
})

function clearCache() {
  window?.localStorage?.clear()
}

const { loading, call: resetHandle } = useLoadingHandler(resetCAN)
</script>

<template>
  <div
    :data-api="store.apiState.reachable"
    :data-can="store.apiState.canReady"
    class="
      w-full pr-6 pb-1 text-right
      flex flex-row justify-end items-center
      bg-error-container text-on-error-container
      data-[api~=false]:bg-error-container
      data-[api~=false]:text-on-error-container
      data-[api~=true]:data-[can~=false]:bg-yellow-300
      data-[api~=true]:data-[can~=false]:text-on-error-container
      data-[can~=true]:bg-primary-container
      data-[can~=true]:text-on-primary-container"

  >
    <Button
      label="Clear Cache"
      size="small"
      link
      @click="clearCache()" />
    <Button
      label="Reset CAN Network"
      size="small"
      link
      class="mr-auto"
      :loading="loading"
      :disabled="loading"
      @click="resetHandle" />
    <div class="text-sm h-min flex self-center">
      API {{ store.apiState.reachable ? 'reachable' : 'disconnected' }} |
      CAN {{ store.apiState.canReady ? 'established' : 'disconnected' }}
    </div>
  </div>
</template>

<style scoped>

</style>