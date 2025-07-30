<script setup lang="ts">
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import STHDeviceTable from '@/components/elements/tables/STHDeviceTable.vue';
import STUDeviceTable from '@/components/elements/tables/STUDeviceTable.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import { useToast } from 'primevue/usetoast';
import {useGeneralStore} from '@/stores/generalStore/generalStore.ts';

const toast = useToast()
const hwStore = useHardwareStore()
const gStore = useGeneralStore()

const { loading: STULoading, call: STUReload } = useLoadingHandler(
  hwStore.updateSTUDeviceList
)
const { loading: STHLoading, call: STHReload } = useLoadingHandler(
  hwStore.updateSTHDeviceList
)

async function STUClickHandler() {
  STUReload().then(() => {
    if(hwStore.STUDeviceList.length === 0) {
      toast.add({
        summary: 'No STU connected',
        detail: 'Check your CAN adapter',
        severity: 'error',
        life: 3000,
        group: 'default'
      })
    }
  })
}

async function STHClickHandler() {
  hwStore.deselectSTHDevices()
  STHReload().then(() => {
    if(hwStore.STHDeviceList.length === 0) {
      toast.add({
        summary: 'No STH found',
        detail: 'Check battery',
        severity: 'error',
        life: 3000,
        group: 'default'
      })
    }
  })
}
</script>

<template>
  <DefaultLayout class="flex flex-col gap-8">
    <div>
      <TextBlock
        heading="Stationary Transceiver Units"
        subheading="Manage the STU all the connections are made from."
        :button-text="hwStore.hasSTU ? 'Reload' : 'Load'"
        :button-icon-class="hwStore.hasSTU ? 'pi pi-sync' : 'pi pi-download'"
        :button-loading="STULoading"
        :button-disabled="gStore.systemState.state === 'SENSOR_NODE_CONNECTED'"
        @button-click="STUClickHandler"
      />
      <STUDeviceTable />
    </div>
    <div class="mt-8">
      <TextBlock
        heading="Sensory Tool Holders"
        subheading="
          Manage STH devices visible to the STU
          and set holder configuration templates."
        :button-text="hwStore.hasSTH ? 'Reload' : 'Load'"
        :button-icon-class="hwStore.hasSTH ? 'pi pi-sync' : 'pi pi-download'"
        :button-loading="STHLoading"
        :button-disabled="gStore.systemState.state === 'SENSOR_NODE_CONNECTED'"
        @button-click="STHClickHandler"
      />
      <STHDeviceTable />
    </div>
  </DefaultLayout>
</template>

<style scoped>

</style>