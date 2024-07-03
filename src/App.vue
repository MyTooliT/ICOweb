<script setup lang="ts">
import ThemeProvider from './stores/ThemeProvider/ThemeProvider.vue';
import Typography from './components/typography/Typography.vue';
</script>

<template>
  <ThemeProvider>
    <Typography />
  </ThemeProvider>
</template>
