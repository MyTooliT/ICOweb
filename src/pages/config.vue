<script setup lang="ts">
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanels from 'primevue/tabpanels';
import Tabs from 'primevue/tabs';
import {
  useRoute,
  useRouter
} from 'vue-router';

const router = useRouter()
const route = useRoute()
</script>

<template>
  <div class="card">
    <Tabs :value="route.name">
      <TabList>
        <Tab
          value="Sensors"
          class="flex items-center"
          @click="router.push({ name: 'Sensors' })"
        >
          <span class="pi pi-gauge inline-block mr-3 !text-xl" />
          Sensor Configuration
        </Tab>
        <Tab
          value="Tools"
          class="flex items-center"
          @click="router.push({ name: 'Tools' })"
        >
          <span class="pi pi-hammer inline-block mr-3 !text-xl" />
          Tool Configuration
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