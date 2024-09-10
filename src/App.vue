<script setup lang="ts">
import ThemeProvider from '@/components/elements/misc/ThemeProvider.vue';
// eslint-disable-next-line max-len
import RouterLinkButton from '@/components/elements/buttons/RouterLinkButton.vue';
import logo from '@/assets/img/ift_logo.jpg';
import {
  ChartBarIcon,
  Cog6ToothIcon,
  ComputerDesktopIcon,
  WrenchIcon
} from '@heroicons/vue/16/solid';
import Toast from 'primevue/toast';
// eslint-disable-next-line max-len
import BottomBar from '@/components/elements/misc/BottomBar.vue';
</script>

<template>
  <ThemeProvider>
    <div class="flex flex-row h-dvh w-dvw bg-surface overflow-hidden">
      <nav class="bg-surface-container flex flex-col z-50">
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
          to="/config/sensors">
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
      <div class="flex flex-col w-full relative">
        <div class="w-full overflow-auto ">
          <router-view />
        </div>
        <BottomBar class="mt-auto" />
      </div>
    </div>
    <Toast />
  </ThemeProvider>
</template>
