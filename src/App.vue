<script setup lang="ts">
import logo from '@/assets/img/ift_logo.jpg';
// eslint-disable-next-line max-len
import RouterLinkButton from '@/components/elements/buttons/RouterLinkButton.vue';
// eslint-disable-next-line max-len
import BottomBar from '@/components/elements/misc/BottomBar.vue';
import ThemeProvider from '@/components/elements/misc/ThemeProvider.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';

const store = useGeneralStore()
</script>

<template>
  <ThemeProvider>
    <div class="flex flex-row h-dvh w-dvw bg-surface overflow-hidden">
      <nav class="bg-surface-container flex flex-col z-50">
        <RouterLinkButton
          name="Home"
          to="/">
          <span
            class="pi pi-wrench"
            style="font-size: 1.5em;" />
          Devices
        </RouterLinkButton>
        <RouterLinkButton
          name="Measure"
          to="/measure">
          <span
            class="pi pi-chart-bar"
            style="font-size: 1.5em;" />
          Measure
        </RouterLinkButton>
        <RouterLinkButton
          name="Files"
          to="/files">
          <span
            class="pi pi-folder"
            style="font-size: 1.5em;" />
          Files
        </RouterLinkButton>
        <RouterLinkButton
          name="Analyze"
          :to="`/analyze${store.fileQuery }`">
          <span
            class="pi pi-search-plus"
            style="font-size: 1.5em;" />
          Analyze
        </RouterLinkButton>
        <RouterLinkButton
          name="Config"
          to="/config/sensors">
          <span
            class="pi pi-cog"
            style="font-size: 1.5em;" />
          Config
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
        <div class="w-full overflow-auto h-stretch">
          <router-view />
        </div>
        <BottomBar class="mt-auto z-50" />
      </div>
    </div>
    <Toast group="default" />
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