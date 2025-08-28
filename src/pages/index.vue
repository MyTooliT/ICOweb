<script setup lang="ts">
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import STHDeviceTable from '@/components/elements/tables/STHDeviceTable.vue';
import STUDeviceTable from '@/components/elements/tables/STUDeviceTable.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import { useToast } from 'primevue/usetoast';
import {onMounted} from 'vue';
import {getSensorInformation} from '@/api/icoapi.ts';

const toast = useToast()
const store = useHardwareStore()

const { loading: STULoading, call: STUReload } = useLoadingHandler(
  store.updateSTUDeviceList
)
const { loading: STHLoading, call: STHReload } = useLoadingHandler(
    () => store.updateSTHDeviceList(import.meta.env.VITE_APPLICATION_DEFAULT_HOLDER ?? 'default-sth')
)

async function STUClickHandler() {
  STUReload().then(() => {
    if(store.STUDeviceList.length === 0) {
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
  STHReload().then(() => {
    if(store.STHDeviceList.length === 0) {
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

onMounted(async () => {
  const { sensors, configurations } = await getSensorInformation()
  store.clearSensorList()
  store.parseSensorList(sensors)
  store.clearHolderList()
  store.parseHolderList(configurations)
})
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
        :button-text="store.hasSTH ? 'Reload' : 'Load'"
        :button-icon-class="store.hasSTH ? 'pi pi-sync' : 'pi pi-download'"
        :button-loading="STHLoading"
        @button-click="STHClickHandler"
      />
      <STHDeviceTable />
    </div>
  </DefaultLayout>
</template>

<style scoped>

</style>