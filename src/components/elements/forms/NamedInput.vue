<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <slot name="header">
      <h4>
        {{ title }}
      </h4>
    </slot>
    <slot />
  </div>
</template>

<style scoped>

</style>