<script setup lang="ts">
import Button from 'primevue/button';
import STHDeviceTable from '@/components/tables/STHDeviceTable.vue';
import STUDeviceTable from '@/components/tables/STUDeviceTable.vue';
import DefaultLayout from '@base/layout/DefaultLayout.vue';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import {useMessageBus} from '@/message';
import CANConnectionPanel from '@/components/misc/CANConnectionPanel.vue';
import HardwareStep, {
  type TStepState
} from '@/components/misc/HardwareStep.vue';
import { computed } from 'vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';

const store = useHardwareStore()
const generalStore = useGeneralStore()
const m = useMessageBus()

const { loading: STULoading, call: STUReload } = useLoadingHandler(
  store.updateSTUDeviceList
)
const { loading: STHLoading, call: STHReload } = useLoadingHandler(
    () => store.updateSTHDeviceList(store.defaultHolderID)
)

// The three steps are used in order: CAN network -> STU -> STH
const canConnected = computed(
  () => generalStore.systemState.canStatus === 'CONNECTED'
)
// Status shown in the header of each step
const stuStatus = computed(() => {
  if(!canConnected.value) return { label: 'Waiting', severity: 'secondary' }
  // Same wording as the STU status in the bottom bar
  return generalStore.systemState.stuConnected
    ? { label: 'Connected', severity: 'success' }
    : { label: 'Not connected', severity: 'danger' }
})
const sthStatus = computed(() => {
  if(!canConnected.value) return { label: 'Waiting', severity: 'secondary' }
  if(store.activeSTH) return { label: 'Connected', severity: 'success' }
  return store.hasSTH
    ? { label: 'Not connected', severity: 'warn' }
    : { label: 'Not loaded', severity: 'secondary' }
})

const stuStep = computed<TStepState>(() => {
  if(!canConnected.value) return 'upcoming'
  return store.hasSTU ? 'done' : 'current'
})
const sthStep = computed<TStepState>(() => {
  if(!canConnected.value) return 'upcoming'
  if(store.activeSTH) return 'done'
  return store.hasSTU ? 'current' : 'upcoming'
})

async function STUClickHandler() {
  STUReload().then(() => {
    if(store.STUDeviceList.length === 0) {
      m.error('No STU found', 'This can happen if the CAN bus is busy or if the STU is not connected.')
    }
  })
}

async function STHClickHandler() {
  await store.refetchSensorsAndHolders()
  STHReload().then(() => {
    if(store.STHDeviceList.length === 0) {
      m.error('No STH Tool Found', 'Make sure the device you want to connect to is charged and in range.')
    }
  })
}
</script>

<template>
  <DefaultLayout class="flex flex-col">
    <CANConnectionPanel />

    <div
      class="ml-[42px] h-6 border-l-2"
      :class="canConnected ? 'border-primary' : 'border-outline-variant'"
    />

    <HardwareStep
      :step="2"
      :state="stuStep"
      :locked="!canConnected"
      locked-message="Connect to a CAN network first."
      title="Stationary Transceiver Units"
      subtitle="Manage the STU all the connections are made from."
      :status="stuStatus.label"
      :severity="stuStatus.severity"
    >
      <template #actions>
        <Button
          outlined
          :label="store.hasSTU ? 'Reload' : 'Load'"
          :icon="store.hasSTU ? 'pi pi-sync' : 'pi pi-download'"
          :loading="STULoading"
          @click="STUClickHandler"
        />
      </template>
      <STUDeviceTable />
    </HardwareStep>

    <div
      class="ml-[42px] h-6 border-l-2"
      :class="stuStep === 'done' ? 'border-primary' : 'border-outline-variant'"
    />

    <HardwareStep
      :step="3"
      :state="sthStep"
      :locked="!canConnected"
      locked-message="Connect to a CAN network first."
      title="Sensory Tool Holders"
      subtitle="Manage STH devices visible to the STU and set holder configuration templates."
      :status="sthStatus.label"
      :severity="sthStatus.severity"
    >
      <template #actions>
        <Button
          outlined
          :label="store.hasSTH ? 'Reload' : 'Load'"
          :icon="store.hasSTH ? 'pi pi-sync' : 'pi pi-download'"
          :loading="STHLoading"
          @click="STHClickHandler"
        />
      </template>
      <STHDeviceTable />
    </HardwareStep>
  </DefaultLayout>
</template>
