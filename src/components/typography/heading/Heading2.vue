<template>
  <h2 class="mb-4 text-3xl">
    <slot>
      {{ text }}
    </slot>
  </h2>
</template>

<script setup lang="ts">
defineProps<{
  text?: string;
}>();
</script>
