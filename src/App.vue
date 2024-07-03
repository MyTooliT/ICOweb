<script setup lang="ts">
import ThemeProvider from './stores/ThemeProvider/ThemeProvider.vue';
import TypographyDemo from './components/typography/TypographyDemo.vue';
</script>

<template>
  <ThemeProvider>
    <TypographyDemo />
  </ThemeProvider>
</template>
