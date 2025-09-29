<script setup lang="ts">
import Button from 'primevue/button';

defineProps<{
  label?: string,
  tooltip?: string,
  borderless?: boolean
}>()
</script>

<template>
  <Button
    v-tooltip.top="{
      value: tooltip
    }"
    rounded
    outlined
    size="small"
    :class="borderless ? '!border-0' : ''"
    :label="label"
    icon="pi pi-times"
    icon-pos="right"
    severity="danger"
  />
</template>

<style scoped>

</style>