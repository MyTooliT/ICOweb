<script setup lang="ts">
import {
  connectCAN, disconnectCAN, getCANNetworks, getCANNetworksQuiet
} from '@/api/icoapi.ts';
import { CANNetwork, CANStatus } from '@/client';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import TextBlock from '@base/components/TextBlock.vue';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Tag from 'primevue/tag';
import ToggleSwitch from 'primevue/toggleswitch';
import { computed, onBeforeUnmount, onMounted } from 'vue';

const store = useGeneralStore()
const state = store.systemState

const { loading: scanLoading, call: scan } = useLoadingHandler(getCANNetworks)
const { loading: connectLoading, call: connect } = useLoadingHandler(
  (network: CANNetwork) => connectCAN({
    interface: network.interface,
    channel: network.channel
  })
)
const { loading: disconnectLoading, call: disconnect } = useLoadingHandler(
  disconnectCAN
)

const busy = computed(() => {
  return scanLoading.value
    || connectLoading.value
    || disconnectLoading.value
    || state.canStatus === 'CONNECTING'
})
const locked = computed(() => busy.value || state.running)

const statusText: Record<CANStatus, string> = {
  NO_NETWORK: 'No network found',
  NETWORK_FOUND: 'Network found, not connected',
  CONNECTING: 'Connecting...',
  CONNECTED: 'Connected',
  ERROR: 'Connection failed'
}
const statusSeverity: Record<CANStatus, string> = {
  NO_NETWORK: 'secondary',
  NETWORK_FOUND: 'warn',
  CONNECTING: 'info',
  CONNECTED: 'success',
  ERROR: 'danger'
}

function isSelected(network: CANNetwork): boolean {
  return state.canSelected?.interface === network.interface
    && state.canSelected?.channel === network.channel
}

function isConnected(network: CANNetwork): boolean {
  return state.canStatus === 'CONNECTED' && isSelected(network)
}

// Periodic search. It only runs while the API is not connected and is paused
// after a failed connection, so that the error stays visible until the user
// searches or connects again.
let timer: number | null = null
const scanStates: CANStatus[] = ['NO_NETWORK', 'NETWORK_FOUND']

async function autoScan() {
  if (!store.canAutoScan || busy.value) return
  if (!scanStates.includes(state.canStatus)) return
  if (!state.reachable) return
  try {
    await getCANNetworksQuiet()
  } catch {
    // Ignore: the next interval tries again
  }
}

onMounted(() => {
  timer = window.setInterval(autoScan, store.canScanIntervalMs)
  void autoScan()
})
onBeforeUnmount(() => {
  if (timer !== null) window.clearInterval(timer)
})
</script>

<template>
  <div>
    <TextBlock
      heading="CAN Network"
      subheading="Search for CAN adapters and connect the API to one of them."
      button-text="Search"
      button-icon-class="pi pi-search"
      :button-loading="scanLoading"
      @button-click="scan()"
    />
    <div class="flex flex-row items-center gap-4 mb-3">
      <Tag
        :value="statusText[state.canStatus]"
        :severity="statusSeverity[state.canStatus]"
      />
      <span
        v-if="state.canStatus === 'CONNECTED'"
        class="text-sm"
      >
        STU {{ state.stuConnected ? 'responding' : 'not responding' }}
      </span>
      <span
        v-if="state.canError"
        class="text-sm text-error"
      >
        {{ state.canError }}
      </span>
      <label class="flex flex-row items-center gap-2 ml-auto text-sm">
        <ToggleSwitch v-model="store.canAutoScan" />
        Search automatically
      </label>
    </div>
    <DataTable :value="state.canNetworks">
      <template #empty>
        No CAN network found. Check that the adapter is plugged in and,
        on Linux, that the interface is up.
      </template>
      <Column header="Interface">
        <template #body="{ data }: { data: CANNetwork }">
          {{ data.interface }}
        </template>
      </Column>
      <Column header="Channel">
        <template #body="{ data }: { data: CANNetwork }">
          {{ data.channel }}
        </template>
      </Column>
      <Column header="Bitrate">
        <template #body="{ data }: { data: CANNetwork }">
          {{ data.bitrate ?? '-' }}
        </template>
      </Column>
      <Column header="Actions">
        <template #body="{ data }: { data: CANNetwork }">
          <Button
            v-if="isConnected(data)"
            rounded
            size="small"
            label="Disconnect"
            icon="pi pi-times"
            :loading="disconnectLoading"
            :disabled="locked"
            @click="disconnect()"
          />
          <Button
            v-else
            rounded
            size="small"
            label="Connect"
            icon="pi pi-link"
            :loading="connectLoading && isSelected(data)"
            :disabled="locked"
            @click="connect(data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
