<script setup lang="ts">
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import STHDeviceTable from '@/components/elements/tables/STHDeviceTable.vue';
import STUDeviceTable from '@/components/elements/tables/STUDeviceTable.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import { useToast } from 'primevue/usetoast';

const toast = useToast()
const store = useHardwareStore()

const { loading: STULoading, call: STUReload } = useLoadingHandler(
  store.updateSTUDeviceList
)
const { loading: STHLoading, call: STHReload } = useLoadingHandler(
  store.updateSTHDeviceList
)
</script>

<template>
  <DefaultLayout class="flex flex-col gap-8">
    <div>
      <TextBlock
        heading="Stationary Transceiver Units"
        subheading="Manage the STU all the connections are made from."
        :button-text="store.hasSTU ? 'Reload' : 'Load'"
        :button-icon-class="store.hasSTU ? 'pi pi-sync' : 'pi pi-download'"
        :button-loading="STULoading"
        @button-click="STUReload().then(() => {
          if(store.getSTUDeviceList.length === 0) {
            toast.add({
              summary: 'No STU connected',
              detail: 'Check your CAN adapter',
              severity: 'error',
              life: 3000,
              group: 'default'
            })
          }})"
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
        :button-loading="STHLoading"
        @button-click="STHReload().then(() => {
          if(store.getSTHDeviceList.length === 0) {
            toast.add({
              summary: 'No STH found',
              detail: 'Check battery',
              severity: 'error',
              life: 3000,
              group: 'default'
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