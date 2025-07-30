<script setup lang="ts">
import {connectSTUDevice, resetCAN} from '@/api/icoapi.ts';
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
const { loading: connectLoading, call: connectCall} = useLoadingHandler(connectSTUDevice)
</script>

<template>
  <div class="w-full absolute bottom-0 left-0 ">
    <div
      :data-api="store.systemState.reachable"
      :data-can="store.systemState.state !== 'DISCONNECTED'"
      :data-running="store.systemState.running"
      class="
        w-full pr-6 pb-1 text-right
        flex flex-row justify-between items-center
        bg-error-container text-on-error-container
        data-[api~=false]:bg-error-container
        data-[api~=false]:text-on-error-container
        data-[api~=true]:data-[can~=false]:bg-yellow-300
        data-[api~=true]:data-[can~=false]:text-on-error-container
        data-[can~=true]:bg-primary-container
        data-[can~=true]:text-on-primary-container
        data-[running~=true]:bg-green-600
        data-[running~=true]:text-on-primary"
    >
      <div>
        <Button
          label="Clear Cache"
          size="small"
          link
          :class="store.systemState.running ? '!text-on-primary' : ''"
          @click="clearCache()" />
        <Button
          v-if="!store.systemState.running"
          label="Reset CAN Network"
          size="small"
          link
          :loading="loading"
          :disabled="loading"
          @click="resetHandle" />
        <Button
          v-if="store.systemState.state === 'DISCONNECTED'"
          label="Connect STU"
          size="small"
          link
          :loading="connectLoading"
          :disabled="connectLoading"
          @click="connectCall" />
      </div>
      <div
        v-if="store.systemState.running"
        class="text-sm h-min flex self-center">
        Ongoing Measurement
      </div>
      <div class="text-sm h-min flex self-center">
        API {{ store.systemState.reachable ? 'reachable' : 'disconnected' }} |
        CAN {{ store.systemState.state !== 'DISCONNECTED' ? 'established' : 'disconnected' }}
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>