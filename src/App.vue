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
import ProgressSpinner from 'primevue/progressspinner';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';

const store = useGeneralStore()
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
        <div
          v-if="store.globalLoader"
          class="
            absolute w-full h-full flex
            justify-center items-center z-40 backdrop-blur">
          <ProgressSpinner />
        </div>
        <div class="w-full overflow-auto ">
          <router-view />
        </div>
        <BottomBar class="mt-auto z-50" />
      </div>
    </div>
    <Toast />
  </ThemeProvider>
</template>

<style>
circle {
  --p-progressspinner-color-1: var(--md-sys-color-primary) !important;
  --p-progressspinner-color-2: var(--md-sys-color-primary) !important;
  --p-progressspinner-color-3: var(--md-sys-color-primary) !important;
  --p-progressspinner-color-4: var(--md-sys-color-primary) !important;
}
</style>