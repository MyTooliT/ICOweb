<script setup lang="ts">
import ThemeProvider from './stores/ThemeProvider/ThemeProvider.vue';
// eslint-disable-next-line max-len
import RouterLinkButton from '@/components/elements/buttons/RouterLinkButton.vue';
import logo from '@/assets/img/ift_logo.jpg';
</script>

<template>
  <ThemeProvider>
    <div class="flex flex-row h-dvh w-dvw bg-surface">
      <nav class="bg-surface-container flex flex-col">
        <RouterLinkButton
          name="Devices"
          to="/" />
        <RouterLinkButton
          name="Measure"
          to="/measure" />
        <RouterLinkButton
          name="Config"
          to="/config/storage" />
        <RouterLinkButton
          name="Analyze"
          to="/analyze" />
        <RouterLinkButton
          name="Help"
          to="/help"
          class="mt-auto">
          <img
            :src="logo"
            alt="IFT Logo"
            class="w-full max-w-16 mx-auto"
          >
        </RouterLinkButton>
      </nav>
      <div>
        <router-view />
      </div>
    </div>
  </ThemeProvider>
</template>
