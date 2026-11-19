<script setup lang="ts">
import BottomBar from '@/components/misc/BottomBar.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { useDisable } from '@/utils/useDisable.ts';
import BaseWrapper from '@base/BaseWrapper.vue';
import Toast from 'primevue/toast';
import { computed, watch } from 'vue';
import logo from '@/theme/logo.png';
import extraLogo from '@/theme/extra.png';

const store = useGeneralStore()
const hardwareStore = useHardwareStore()

// Devices are only valid for the CAN network they were found on
watch(() => store.systemState.canStatus, (status, previous) => {
  // With several units every unit has its own devices, see below
  if (store.systemState.multiUnit) return
  if (status === 'CONNECTED') {
    void hardwareStore.updateSTUDeviceList()
  } else if (previous === 'CONNECTED') {
    hardwareStore.STUDeviceList = []
    hardwareStore.clearSTHDeviceList()
  }
})

// The API is the source of truth for the connected sensor device. Follow it,
// also when another client (e.g. a remote user) connects or disconnects one.
watch(() => store.systemState.sthConnected, (connected) => {
  if (store.systemState.multiUnit) return
  hardwareStore.applyConnectedSTH(connected)
})

// With several units (multi STU support) every unit has its own STU and
// sensor devices: Load the STU of new units, forget those of units that are
// gone and follow the sensor device each unit is connected to.
const unitsKey = computed(() =>
  (store.systemState.units ?? [])
    .map(unit => `${unit.unit}|${unit.stu_connected}`)
    .join(','))
watch(unitsKey, async () => {
  const units = store.systemState.units
  if (!units) return
  hardwareStore.forgetUnitsExcept(units.map(unit => unit.unit))
  for (const unit of units) {
    if (!unit.stu_connected) {
      hardwareStore.clearSTUDeviceList(unit.unit)
      hardwareStore.clearSTHDeviceList(unit.unit)
    } else if (hardwareStore.stuListFor(unit.unit).length === 0) {
      await hardwareStore.updateSTUDeviceList(unit.unit)
    }
  }
}, { immediate: true })
watch(() => store.systemState.units, (units) => {
  if (units) hardwareStore.applyConnectedSTHs(units)
}, { deep: true, immediate: true })

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
  name: 'Docs',
  to: '/docs',
  iconClass: 'pi pi-book',
  text: 'Docs'
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
