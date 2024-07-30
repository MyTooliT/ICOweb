<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import Heading3 from '@/components/typography/heading/Heading3.vue';
import STHDeviceTable from '@/components/elements/tables/STHDeviceTable.vue';
import STUDeviceTable from '@/components/elements/tables/STUDeviceTable.vue';
import Button from 'primevue/button';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';

const store = useHardwareStore()
</script>

<template>
  <DefaultLayout>
    <div class="flex flex-row justify-between py-3">
      <Heading3>Stationary Transceiver Units</Heading3>
      <Button
        label="Reload"
        outlined
        @click="store.updateSTUDeviceList()" />
    </div>
    <Suspense>
      <STUDeviceTable />
    </Suspense>
    <div class="flex flex-row justify-between py-3">
      <Heading3>Sensory Tool Holders</Heading3>
      <Button
        label="Reload"
        outlined
        @click="store.updateSTHDeviceList()" />
    </div>
    <Suspense>
      <STHDeviceTable />
    </Suspense>
  </DefaultLayout>
</template>

<style scoped>

</style>