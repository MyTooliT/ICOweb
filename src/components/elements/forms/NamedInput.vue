<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <h4>
      {{ title }}
    </h4>
    <slot />
  </div>
</template>

<style scoped>

</style>