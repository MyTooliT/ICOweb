<script setup lang="ts">
import ThemeProvider from './stores/ThemeProvider/ThemeProvider.vue';
</script>

<template>
  <ThemeProvider>
    <router-view />
  </ThemeProvider>
</template>
