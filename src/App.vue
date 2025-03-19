<script setup lang="ts">
import logo from '@/assets/img/ift_logo.jpg';
// eslint-disable-next-line max-len
import RouterLinkButton from '@/components/elements/buttons/RouterLinkButton.vue';
import BottomBar from '@/components/elements/misc/BottomBar.vue';
import ThemeProvider from '@/components/elements/misc/ThemeProvider.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';
// eslint-disable-next-line max-len
import NavigationButtons from '@/components/elements/controls/NavigationButtons.vue';

const store = useGeneralStore()
</script>

<template>
  <ThemeProvider>
    <div class="flex flex-row h-dvh w-dvw bg-surface overflow-hidden">
      <nav class="bg-surface-container flex flex-col z-50">
        <NavigationButtons />
        <div class="mt-auto">
          <RouterLinkButton
            name="Help"
            to="/help"
          >
            <img
              :src="logo"
              alt="IFT Logo"
              class="w-full max-w-16 mx-auto"
            >
          </RouterLinkButton>
        </div>
      </nav>
      <div class="flex flex-col w-full relative">
        <div
          v-if="store.globalLoader"
          class="
            absolute w-full [height:calc(100%-39px)] flex
            justify-center items-center z-40 backdrop-blur">
          <ProgressSpinner />
        </div>
        <div class="w-full h-full overflow-auto ">
          <router-view />
        </div>
        <BottomBar />
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