<script setup lang="ts">
import BottomBar from '@/components/misc/BottomBar.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useDisable } from '@/utils/useDisable.ts';
import BaseWrapper from '@base/BaseWrapper.vue';
import Toast from 'primevue/toast';
import { computed } from 'vue';
import logo from '@/theme/logo.png';
import extraLogo from '@/theme/extra.png';

const store = useGeneralStore()

const navLogoExtra = import.meta.env.VITE_APPLICATION_THEME_EXTRALOGO === 'true'
  ? extraLogo
  : undefined

const navItems = computed(() => [{
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
</script>

<template>
  <BaseWrapper
    :theme-class="store.getActiveTheme"
    :nav-items="navItems"
    :nav-logo="logo"
    nav-logo-alt="Logo"
    :nav-extra-logo="navLogoExtra"
    nav-extra-logo-alt="Extra Logo for ICOweb client"
    :show-loader="store.globalLoader"
    :loader-message="store.getLoaderInfoMessage"
  >
    <div class="w-full h-dvh overflow-y-scroll overflow-x-auto">
      <router-view />
    </div>
    <template #bottom>
      <BottomBar />
    </template>
  </BaseWrapper>
  <Toast group="default" />
</template>
