<script setup lang="ts">
import BottomBar from './BottomBar.vue';
import { ping } from '@/api/requests';
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
</script>

<template>
  <BottomBar
    :data-state="apiReachable"
    class="
      data-[state~=true]:bg-primary-container bg-error-container
      data-[state~=true]:text-on-primary-container text-on-error-container"
  >
    {{ apiReachable ? 'connected' : 'disconnected' }}
  </BottomBar>
</template>

<style scoped>

</style>