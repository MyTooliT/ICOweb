<script setup lang="ts">
import {useGeneralStore} from '@/stores/generalStore/generalStore.ts';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';

import BaseWrapper from '@/ICOClientBase/BaseWrapper.vue';
import Divider from '@/ICOClientBase/components/Divider.vue'
import BottomBar, {State} from '@/ICOClientBase/components/bottom/BottomBar.vue'
import {computed} from 'vue';
import {useDisable} from '@/utils/useDisable.ts';
import navLogo from './theme/logo.png'
import Button from 'primevue/button';
import {useLoadingHandler} from '@/utils/useLoadingHandler.ts';
import {resetCAN} from '@/api/icoapi.ts';

const store = useGeneralStore()

function clearCache() {
  window?.localStorage?.clear()
}

const { loading, call: resetHandle } = useLoadingHandler(resetCAN)

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

const statusItems = computed(() => {
  return [
    { name: 'API', status: store.systemState.reachable ? 'Reachable' : 'Unreachable' },
    { name: 'CAN', status: store.systemState.canReady ? 'Connected' : 'Disconnected'}
  ]
})

const systemState = computed(() => {
  if(store.systemState.reachable) {
    if(store.systemState.canReady) {
      if(store.systemState.running) {
        return State.ACTIVE
      }
      return State.IDLE
    }
    return State.ERROR
  }
  return State.ERROR
})
</script>

<template>
  <BaseWrapper
    :theme-class="store.getActiveTheme"
    :nav-items="menuItems"
    :nav-logo="navLogo"
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
      <Divider />
      <router-view />
    </div>
    <Toast group="default" />
    <template #bottom>
      <BottomBar
        :status-infos="statusItems"
        :state="systemState"
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