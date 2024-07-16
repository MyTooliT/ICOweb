<script setup lang="ts">
import ThemeProvider from './stores/ThemeProvider/ThemeProvider.vue';
// eslint-disable-next-line max-len
import RouterLinkButton from '@/components/elements/buttons/RouterLinkButton.vue';
import logo from '@/assets/img/ift_logo.jpg';
import {
  ChartBarIcon,
  Cog6ToothIcon,
  ComputerDesktopIcon,
  WrenchIcon
} from '@heroicons/vue/16/solid';
</script>

<template>
  <ThemeProvider>
    <div class="flex flex-row h-dvh w-dvw bg-surface">
      <nav class="bg-surface-container flex flex-col">
        <RouterLinkButton
          name="Devices"
          to="/">
          <WrenchIcon class="size-8 pb-1" />
          Devices
        </RouterLinkButton>
        <RouterLinkButton
          name="Measure"
          to="/measure">
          <ChartBarIcon class="size-8 pb-1" />
          Measure
        </RouterLinkButton>
        <RouterLinkButton
          name="Config"
          to="/config/storage">
          <Cog6ToothIcon class="size-8 pb-1" />
          Config
        </RouterLinkButton>
        <RouterLinkButton
          name="Analyze"
          to="/analyze">
          <ComputerDesktopIcon class="size-8 pb-1" />
          Analyze
        </RouterLinkButton>
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
