<template>
  <h1 class="mb-2 text-1xl">
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
