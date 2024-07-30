<script setup lang="ts">
import Button from 'primevue/button';
import { computed } from 'vue';
import { STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';

const props = defineProps<{
  device: STHDevice
}>()

const emits = defineEmits<{
  connect: [void],
  disconnect: [void],
}>()

const label = computed<string>(() => {
  switch(props.device.getConnectionStatus()) {
    case 'connected':
      return 'Disconnect'

    case 'connecting':
      return 'Connecting'

    case 'disconnected':
      return 'Connect'
  }
})

const icon = computed<string>(() => {
  switch(props.device.getConnectionStatus()) {
    case 'connected':
      return 'check'

    case 'connecting':
      return 'spinner'

    case 'disconnected':
      return 'wifi'
  }
})

function clickHandler(): void {
  const state = props.device.getConnectionStatus()
  if(state === 'disconnected') { emits('connect') }
  if(state === 'connected') { emits('disconnect') }
}
</script>

<template>
<Button
  size="small"
  rounded
  :label="label"
  :icon="`pi pi-${icon}`"
  :loading="props.device.getConnectionStatus() === 'connecting'"
  @click="clickHandler" />
</template>

<style scoped>

</style>