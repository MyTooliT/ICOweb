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
  await store.systemState.checkState()
  store.systemState.registerInterval(5000)
})

onBeforeUnmount(() => {
  store.systemState.deregisterInterval()
})

function clearCache() {
  window?.localStorage?.clear()
}

const { loading, call: resetHandle } = useLoadingHandler(resetCAN)
</script>

<template>
  <div class="w-full absolute bottom-0 left-0 ">
    <div
      v-if="store.systemState.running"
      class="w-full text-center
      text-[length:--p-button-sm-font-size]
      py-[--p-button-padding-y]
      bg-green-600 text-on-primary"
    >
      Ongoing Measurement
    </div>
    <div
      v-else
      :data-api="store.systemState.reachable"
      :data-can="store.systemState.canReady"
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
        API {{ store.systemState.reachable ? 'reachable' : 'disconnected' }} |
        CAN {{ store.systemState.canReady ? 'established' : 'disconnected' }}
      </div>

    </div>
  </div>
</template>

<style scoped>

</style>