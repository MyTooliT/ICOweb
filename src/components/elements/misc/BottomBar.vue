<script setup lang="ts">
import { resetCAN } from '@/api/requests.ts';
import { useAPIState } from '@/utils/useAPIState.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import Button from 'primevue/button';
import {
  onBeforeUnmount,
  onMounted
} from 'vue';

const apiState = useAPIState();

onMounted(async () => {
  apiState.registerInterval(5000)
})

onBeforeUnmount(() => {
  apiState.deregisterInterval()
})

function clearCache() {
  window?.localStorage?.clear()
}

const { loading, call: resetHandle } = useLoadingHandler(resetCAN)
</script>

<template>
  <div
    :data-state="apiState.reachable.value"
    :data-api="apiState.reachable.value"
    :data-can="apiState.canReady.value"
    class="
      w-full pr-6 pb-1 text-right
      flex flex-row justify-end items-center
      data-[api~=true]:bg-primary-container bg-error-container
      data-[api~=true]:text-on-primary-container text-on-error-container
      data-[can~=false]:bg-yellow-300
      data-[can~=false]:text-on-error-container"

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
      API {{ apiState.reachable.value ? 'connected' : 'disconnected' }} |
      CAN {{ apiState.canReady.value ? 'connected' : 'disconnected' }}
    </div>
  </div>
</template>

<style scoped>

</style>