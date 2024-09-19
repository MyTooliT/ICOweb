<script setup lang="ts">
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import STHDeviceTable from '@/components/elements/tables/STHDeviceTable.vue';
import STUDeviceTable from '@/components/elements/tables/STUDeviceTable.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { useToast } from 'primevue/usetoast';

const toast = useToast()
const store = useHardwareStore()
</script>

<template>
  <DefaultLayout class="flex flex-col gap-8">
    <div>
      <TextBlock
        heading="Stationary Transceiver Units"
        subheading="Manage the STU all the connections are made from."
        :button-text="store.hasSTU ? 'Reload' : 'Load'"
        :button-icon-class="store.hasSTU ? 'pi pi-sync' : 'pi pi-download'"
        :button-loading="store.STUDeviceLoading"
        @button-click="store.updateSTUDeviceList().then(() => {
          if(store.getSTUDeviceList.length === 0) {
            toast.add({
              summary: 'No STU connected',
              detail: 'Check your CAN adapter',
              severity: 'error',
              life: 3000
            })
          }
        })"
      />
      <STUDeviceTable />
    </div>
    <div>
      <TextBlock
        heading="Sensory Tool Holders"
        subheading="
          Manage STH devices visible to the STU
          and set holder configuration templates."
        :button-text="store.hasSTH ? 'Reload' : 'Load'"
        :button-icon-class="store.hasSTH ? 'pi pi-sync' : 'pi pi-download'"
        :button-loading="store.STHDevicesLoading"
        @button-click="store.updateSTHDeviceList().then(() => {
          if(store.getSTHDeviceList.length === 0) {
            toast.add({
              summary: 'No STH found',
              detail: 'Check battery',
              severity: 'error',
              life: 3000
            })
          }
        })"
      />
      <STHDeviceTable />
    </div>
  </DefaultLayout>
</template>

<style scoped>

</style>