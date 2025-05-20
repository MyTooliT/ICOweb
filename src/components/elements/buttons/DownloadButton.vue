<script setup lang="ts">
import Button from 'primevue/button';

defineProps<{
  link: string
}>()
</script>

<template>
  <Button
    v-tooltip.top="'Download'"
    icon="pi pi-download"
    as="a"
    download
    :href="link"
    size="small"
    rounded
    aria-label="Download"
    outlined
  />
</template>

<style scoped>

</style>