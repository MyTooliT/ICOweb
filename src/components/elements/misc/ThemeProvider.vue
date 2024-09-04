<template>
  <div :class="theme.getActiveTheme">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';

const theme = useGeneralStore();
</script>
