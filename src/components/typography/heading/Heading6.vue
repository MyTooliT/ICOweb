<template>
  <h6 class="mb-2">
    <slot>
      {{ text }}
    </slot>
  </h6>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps<{
  text?: string;
}>();
</script>
