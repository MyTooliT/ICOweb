<template>
  <div :class="theme.getActiveTheme">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useThemeProviderStore } from './themeProvider';
const theme = useThemeProviderStore();
</script>
