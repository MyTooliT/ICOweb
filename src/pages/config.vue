<script setup lang="ts">
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import { useRouter } from 'vue-router';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';

const router = useRouter()
const store = useGeneralStore()
</script>

<template>
  <div class="card">
    <Tabs v-model:value="store.tabIndex">
      <TabList>
        <Tab
          value="0"
          class="flex items-center"
          @click="router.push('/config/sensors')"
        >
          <span class="pi pi-gauge inline-block mr-3 !text-xl" />
          Sensor Configuration
        </Tab>
        <Tab
          value="1"
          class="flex items-center"
          @click="router.push('/config/tools')"
        >
          <span class="pi pi-hammer inline-block mr-3 !text-xl" />
          Tool Configuration
        </Tab>
        <Tab
          value="2"
          class="flex items-center"
          @click="router.push('/config/storage')"
        >
          <span class="pi pi-folder inline-block mr-3 !text-xl" />
          Files & Storage
        </Tab>
      </TabList>
      <TabPanels
        unstyled
        class="bg-inherit"
      >
        <router-view />
      </TabPanels>
    </Tabs>
  </div>
</template>

<style scoped>

</style>