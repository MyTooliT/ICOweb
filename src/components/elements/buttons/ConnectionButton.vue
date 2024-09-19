<script setup lang="ts">
import { STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';
import Button from 'primevue/button';
import { computed } from 'vue';

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

    case 'disconnecting':
      return 'Disconnecting'

    default:
      return ''
  }
})

const icon = computed<string>(() => {
  switch(props.device.getConnectionStatus()) {
    case 'connected':
      return 'times'

    case 'connecting':
      return 'spinner'

    case 'disconnected':
      return 'wifi'

    case 'disconnecting':
      return 'spinner'

    default:
      return ''
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
    :severity="props.device.getConnectionStatus() === 'connected'
      ? 'danger'
      : 'primary'"
    :loading="['connecting', 'disconnecting']
      .includes(props.device.getConnectionStatus())"
    @click="clickHandler" />
</template>

<style scoped>

</style>