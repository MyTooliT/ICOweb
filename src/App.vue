<script setup lang="ts">
import ThemeProvider from './stores/ThemeProvider/ThemeProvider.vue';
import Typography from './components/typography/Typography.vue';
import Elements from './components/elements/Elements.vue';
</script>

<template>
  <ThemeProvider>
    <Typography />
    <Elements />
  </ThemeProvider>
</template>
