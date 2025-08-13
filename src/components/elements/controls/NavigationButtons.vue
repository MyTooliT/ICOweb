<script setup lang="ts">
import {useDisable} from '@/utils/useDisable.ts';
import {useGeneralStore} from '@/stores/generalStore/generalStore.ts';
import RouterLinkButton from '@/components/elements/buttons/RouterLinkButton.vue';
import {computed} from 'vue';

const store = useGeneralStore();

const menuItems = computed<Array<{
  name: string,
  to: string,
  icon: string,
  text: string,
  disabled?: boolean,
}>>(() => [{
  name: 'Home',
  to: '/',
  icon: 'wrench',
  text: 'Devices',
  disabled: store.systemState.running
}, {
  name: 'Measure',
  to: '/measure',
  icon: 'chart-bar',
  text: 'Measure'
}, {
  name: 'Files',
  to: '/files',
  icon: 'folder',
  text: 'Files'
}, {
  name: 'Analyze',
  to: `/analyze${store.fileQuery}`,
  icon: 'search-plus',
  text: 'Analyze'
}, {
  name: 'Config',
  to: '/config/sensors',
  icon: 'cog',
  text: 'Config'
}, {
  name: 'Logs',
  to: '/logs',
  icon: 'file-word',
  text: 'Logs'
}, {
  name: 'Dataspace',
  to: '/',
  icon: 'box',
  text: 'Dataspace',
  disabled: true
}].filter(item => useDisable().pageEnabled(item.name)))
</script>

<template>
  <RouterLinkButton
    v-for="item in menuItems"
    :key="item.name"
    :name="item.name"
    :to="item.to"
    :disabled="item.disabled ?? false"
  >
    <span
      :class="`pi pi-${item.icon}`"
      style="font-size: 1.5em;" />
    {{ item.text }}
  </RouterLinkButton>
</template>
