<script setup lang="ts">
import Button from 'primevue/button';
import { ping } from '@/api/requests.ts';
import {
  onBeforeUnmount,
  onMounted,
  ref
} from 'vue';

const apiReachable = ref<boolean>(false);
let intervalID = 0;

onMounted(async () => {
  await checkAvailability();
  intervalID = window.setInterval(async () => {
    await checkAvailability();
  }, 5000)
})

onBeforeUnmount(() => {
  clearInterval(intervalID)
})

async function checkAvailability(): Promise<void> {
  try {
    await ping();
    apiReachable.value = true;
  } catch (error) {
    apiReachable.value = false;
  }
}

function clearCache() {
  window?.localStorage?.clear()
}
</script>

<template>
  <div
    :data-state="apiReachable"
    class="
      w-full pr-6 pb-1 text-right absolute bottom-0 right-0
      flex flex-row justify-end items-center
      data-[state~=true]:bg-primary-container bg-error-container
      data-[state~=true]:text-on-primary-container text-on-error-container"
  >
    <Button
      label="Clear Cache"
      size="small"
      link
      class="mr-auto"
      @click="clearCache()" />
    <div class="text-sm h-min flex self-center">
      {{ apiReachable ? 'connected' : 'disconnected' }}
    </div>
  </div>
</template>

<style scoped>

</style>