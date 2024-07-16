<template>
  <h3 class="mb-3 text-2xl">
    <slot>
      {{ text }}
    </slot>
  </h3>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps<{
  text?: string;
}>();
</script>
