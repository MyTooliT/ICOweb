<script setup lang="ts">
// The application shell - layout, sidebar, loader and bottom bar - comes from
// ICOClientBase (src/base, aliased @base). This file only supplies what is
// specific to ICOweb: the menu, the logos and the system status.
import BaseWrapper from '@base/BaseWrapper.vue';
import BottomBar, { State } from '@base/components/bottom/BottomBar.vue';
import { resetCAN } from '@/api/icoapi.ts';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useDisable } from '@/utils/useDisable.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';
import { computed, onMounted } from 'vue';
import navLogo from '@/theme/logo.png';
import navExtraLogo from '@/theme/extra.png';

const store = useGeneralStore()

onMounted(async () => {
  await store.systemState.checkState()
})

function clearCache() {
  window?.localStorage?.clear()
}

const { loading, call: resetHandle } = useLoadingHandler(resetCAN)

const hasExtraLogo = import.meta.env.VITE_APPLICATION_THEME_EXTRALOGO === 'true'

// `name` must match the route name: that is how the sidebar decides which button
// is active.
const menuItems = computed(() => [{
  name: 'Home',
  to: '/',
  iconClass: 'pi pi-wrench',
  text: 'Devices',
  disabled: store.systemState.running
}, {
  name: 'Measure',
  to: '/measure',
  iconClass: 'pi pi-chart-bar',
  text: 'Measure'
}, {
  name: 'Files',
  to: '/files',
  iconClass: 'pi pi-folder',
  text: 'Files'
}, {
  name: 'Analyze',
  to: `/analyze${store.fileQuery}`,
  iconClass: 'pi pi-search-plus',
  text: 'Analyze'
}, {
  name: 'Config',
  to: '/config',
  iconClass: 'pi pi-cog',
  text: 'Config'
}, {
  name: 'Logs',
  to: '/logs',
  iconClass: 'pi pi-file-word',
  text: 'Logs'
}, {
  name: 'Dataspace',
  to: '/',
  iconClass: 'pi pi-box',
  text: 'Dataspace',
  disabled: true
}].filter(item => useDisable().pageEnabled(item.name)))

const statusItems = computed(() => [
  { name: 'API', status: store.systemState.reachable ? 'reachable' : 'disconnected' },
  { name: 'CAN', status: store.systemState.canReady ? 'established' : 'disconnected' }
])

const systemState = computed<State>(() => {
  if(!store.systemState.reachable) return State.ERROR
  if(!store.systemState.canReady) return State.WARNING
  return store.systemState.running ? State.ACTIVE : State.IDLE
})

// ICOweb's own bottom bar colours. The base defaults differ for WARNING
// (tertiary-container), so the mapping is passed explicitly to keep the states
// operators already know: API unreachable red, CAN not ready solid primary,
// CAN ready primary-container, measurement running secondary.
const stateClassMap: Record<State, string> = {
  [State.ERROR]: 'bg-error-container text-on-error-container',
  [State.WARNING]: 'bg-primary text-on-primary',
  [State.IDLE]: 'bg-primary-container text-on-primary-container',
  [State.ACTIVE]: 'bg-secondary text-on-secondary'
}
</script>

<template>
  <BaseWrapper
    :theme-class="store.getActiveTheme"
    :nav-items="menuItems"
    :nav-logo="navLogo"
    nav-logo-alt="ICOweb"
    :nav-extra-logo="hasExtraLogo ? navExtraLogo : undefined"
    nav-extra-logo-alt="Secondary logo"
    :show-loader="store.globalLoader"
    :loader-message="store.getLoaderInfoMessage"
  >
    <template #loader>
      <div
        class="
          absolute w-full [height:calc(100%-39px)] flex flex-col gap-3
          justify-center items-center z-40 backdrop-blur">
        <ProgressSpinner />
        <h4> {{ store.getLoaderInfoMessage }} </h4>
      </div>
    </template>
    <div class="w-full min-h-full overflow-y-scroll overflow-x-auto">
      <router-view />
    </div>
    <Toast group="default" />
    <template #bottom>
      <BottomBar
        :status-infos="statusItems"
        :state="systemState"
        :state-class-map="stateClassMap"
      >
        <template #left>
          <div class="bg-inherit text-inherit">
            <Button
              label="Clear Cache"
              size="small"
              link
              class="!text-inherit"
              @click="clearCache()" />
            <Button
              v-if="!store.systemState.running"
              label="Reset CAN Network"
              size="small"
              link
              :loading="loading"
              :disabled="loading"
              class="!text-inherit"
              @click="resetHandle" />
          </div>
        </template>
        <div
          v-if="store.systemState.running"
          class="text-sm h-min flex self-center">
          Ongoing Measurement
        </div>
      </BottomBar>
    </template>
  </BaseWrapper>
</template>

<style>
circle {
  --p-progressspinner-color-1: var(--md-sys-color-primary) !important;
  --p-progressspinner-color-2: var(--md-sys-color-primary) !important;
  --p-progressspinner-color-3: var(--md-sys-color-primary) !important;
  --p-progressspinner-color-4: var(--md-sys-color-primary) !important;
}
</style>
