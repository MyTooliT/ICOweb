<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import Heading3 from '@/components/typography/heading/Heading3.vue';
import STHDeviceTable from '@/components/elements/tables/STHDeviceTable.vue';
import STUDeviceTable from '@/components/elements/tables/STUDeviceTable.vue';
import Chart from '@/components/elements/Chart.vue';
import Button from 'primevue/button';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { useToast } from 'primevue/usetoast';

const toast = useToast()
const store = useHardwareStore()
</script>

<template>
  <DefaultLayout>
    <div class="flex flex-row justify-between py-3">
      <Heading3>Stationary Transceiver Units</Heading3>
      <Button
        label="Reload"
        outlined
        :loading="store.STUDeviceLoading"
        :disabled="store.STHDevicesLoading"
        @click="store.updateSTUDeviceList().then(() => {
          if(store.getSTUDeviceList.length === 0) {
            toast.add({
              summary: 'No STU connected',
              detail: 'Check your CAN adapter',
              severity: 'error',
              life: 3000
            })
          }
        })" />
    </div>
    <Suspense>
      <STUDeviceTable />
    </Suspense>
    <div class="flex flex-row justify-between py-3">
      <Heading3>Sensory Tool Holders</Heading3>
      <Button
        label="Reload"
        outlined
        :loading="store.STHDevicesLoading"
        :disabled="!store.activeSTU || store.STUDeviceLoading"
        @click="store.updateSTHDeviceList().then(() => {
          if(store.getSTHDeviceList.length === 0) {
            toast.add({
              summary: 'No STH found',
              detail: 'Check battery',
              severity: 'error',
              life: 3000
            })
          }
        })" />
    </div>
    <Suspense>
      <STHDeviceTable />
    </Suspense>
    <Chart />
  </DefaultLayout>
</template>

<style scoped>

</style>