<script setup lang="ts">
// eslint-disable-next-line max-len
import BottomBar from '@/components/elements/misc/BottomBar.vue';
import ThemeProvider from '@/components/elements/misc/ThemeProvider.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';
// eslint-disable-next-line max-len
import NavigationButtons from '@/components/elements/controls/NavigationButtons.vue';
import NavigationExtras from '@/components/elements/controls/NavigationExtras.vue';

const store = useGeneralStore()
</script>

<template>
  <ThemeProvider>
    <div class="flex flex-row h-dvh w-dvw bg-surface overflow-hidden">
      <nav class="bg-surface-container flex flex-col z-50">
        <NavigationButtons />
        <NavigationExtras />
      </nav>
      <div class="flex flex-col w-full relative">
        <div
          v-if="store.globalLoader"
          class="
            absolute w-full [height:calc(100%-39px)] flex flex-col gap-3
            justify-center items-center z-40 backdrop-blur">
          <ProgressSpinner />
          <h4> {{ store.getLoaderInfoMessage }} </h4>
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