<template>
  <h4 class="mb-3 text-xl">
    <slot>
      {{ text }}
    </slot>
  </h4>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps<{
  text?: string;
}>();
</script>
