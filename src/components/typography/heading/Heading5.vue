<template>
  <h5 class="mb-2 text-lg">
    <slot>
      {{ text }}
    </slot>
  </h5>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps<{
  text?: string;
}>();
</script>
