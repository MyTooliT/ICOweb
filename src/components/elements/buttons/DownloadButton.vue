<script setup lang="ts">
import Button from 'primevue/button';

defineProps<{
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
    :label="compact ? '' : 'Download HDF5 File'"
    aria-label="Download"
    outlined
  />
</template>