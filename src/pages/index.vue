<script setup lang="ts">
import TextBlock from '@/components/misc/TextBlock.vue';
import STHDeviceTable from '@/components/tables/STHDeviceTable.vue';
import STUDeviceTable from '@/components/tables/STUDeviceTable.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import {useMessageBus} from '@/message';

const store = useHardwareStore()
const m = useMessageBus()

const { loading: STULoading, call: STUReload } = useLoadingHandler(
  store.updateSTUDeviceList
)
const { loading: STHLoading, call: STHReload } = useLoadingHandler(
    () => store.updateSTHDeviceList(store.defaultHolderID)
)

async function STUClickHandler() {
  STUReload().then(() => {
    if(store.STUDeviceList.length === 0) {
      m.error('No STU found', 'This can happen if the CAN bus is busy or if the STU is not connected.')
    }
  })
}

async function STHClickHandler() {
  STHReload().then(() => {
    if(store.STHDeviceList.length === 0) {
      m.error('No STH Tool Found', 'Make sure the device you want to connect to is charged and in range.')
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