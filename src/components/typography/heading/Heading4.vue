<template>
  <h1 class="mb-3 text-3xl">
    <slot>
      {{ text }}
    </slot>
  </h1>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps<{
  text?: string;
}>();
</script>
