<script setup lang="ts">
import BottomBar from './BottomBar.vue';
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
  <BottomBar
    :data-state="apiReachable"
    class="
      flex flex-row justify-center align-middle
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
  </BottomBar>
</template>

<style scoped>

</style>