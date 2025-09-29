<script setup lang="ts">
import Button from 'primevue/button';

defineProps<{
  label?: string,
  link: string
  compact?: boolean
}>()
</script>

<template>
  <Button
    v-tooltip.top="compact ? 'Download' : ''"
    icon="pi pi-download"
    as="a"
    download
    :href="link"
    :size="compact ? 'small' : undefined"
    :rounded="compact"
    :label="compact ? '' : label"
    aria-label="Download"
    outlined
  />
</template>