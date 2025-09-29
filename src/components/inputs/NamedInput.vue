<script setup lang="ts">
defineProps<{
  title: string,
  tooltip?: string,
}>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <slot name="header">
      <h4>
        {{ title }}
        <i
          v-if="tooltip"
          v-tooltip.top="{
            value: tooltip
          }"
          class="pi pi-info-circle" />
      </h4>
    </slot>
    <slot />
  </div>
</template>

<style scoped>

</style>