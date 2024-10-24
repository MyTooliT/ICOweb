<template>
  <h1 class="mb-4 text-3xl">
    <slot>
      {{ text }}
    </slot>
  </h1>
</template>

<script setup lang="ts">
defineProps<{
  text?: string;
}>();
</script>
