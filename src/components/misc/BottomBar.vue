<script setup lang="ts">
import { resetCAN } from '@/api/icoapi.ts';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import Button from 'primevue/button';
import {
  onMounted
} from 'vue';

const store = useGeneralStore();

onMounted(async () => {
  await store.systemState.checkState()
})

function clearCache() {
  window?.localStorage?.clear()
}

const { loading, call: resetHandle } = useLoadingHandler(resetCAN)
</script>

<template>
  <div class="w-full absolute bottom-0 left-0 ">
    <div
      :data-api="store.systemState.reachable"
      :data-can="store.systemState.canReady"
      :data-running="store.systemState.running"
      class="
        w-full pr-6 pb-1 text-right
        flex flex-row justify-between items-center
        bg-error-container text-on-error-container
        data-[api~=false]:bg-error-container
        data-[api~=false]:text-on-error-container
        data-[api~=true]:data-[can~=false]:bg-primary
        data-[api~=true]:data-[can~=false]:text-on-primary
        data-[can~=true]:bg-primary-container
        data-[can~=true]:text-on-primary-container
        data-[running~=true]:bg-secondary
        data-[running~=true]:text-on-secondary"
    >
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
      <div
        v-if="store.systemState.running"
        class="text-sm h-min flex self-center">
        Ongoing Measurement
      </div>
      <div class="text-sm h-min flex self-center text-inherit">
        API {{ store.systemState.reachable ? 'reachable' : 'disconnected' }} |
        CAN {{ store.systemState.canReady ? 'established' : 'disconnected' }}
      </div>
    </div>
  </div>
</template>