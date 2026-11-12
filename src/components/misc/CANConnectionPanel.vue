<script setup lang="ts">
import {
  connectCAN, disconnectCAN, getCANNetworks, getCANNetworksQuiet, resetCAN
} from '@/api/icoapi.ts';
import { CANNetwork, CANStatus } from '@/client';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import HardwareStep from '@/components/misc/HardwareStep.vue';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Popover from 'primevue/popover';
import ToggleSwitch from 'primevue/toggleswitch';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

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

const { loading: resetLoading, call: reset } = useLoadingHandler(resetCAN)
const resetInfo = ref<InstanceType<typeof Popover> | null>(null)

const busy = computed(() => {
  return scanLoading.value
    || connectLoading.value
    || disconnectLoading.value
    || resetLoading.value
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

// Periodic discovery. It only runs while the API is not connected and is
// paused after a failed connection, so that the error stays visible until the
// user discovers or connects again.
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
  <HardwareStep
    :step="1"
    :state="state.canStatus === 'CONNECTED' ? 'done' : 'current'"
    title="CAN Network"
    subtitle="Discover CAN adapters and connect the API to one of them."
    :status="statusText[state.canStatus]"
    :severity="statusSeverity[state.canStatus]"
    :error="state.canError ?? ''"
  >
    <template #actions>
      <label class="flex flex-row items-center gap-2 text-sm">
        <ToggleSwitch v-model="store.canAutoScan" />
        Discover automatically
      </label>
      <Button
        outlined
        label="Discover"
        icon="pi pi-sitemap"
        :loading="scanLoading"
        @click="scan()"
      />
    </template>
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
          <div
            v-if="isConnected(data)"
            class="flex flex-row items-center gap-2"
          >
            <Button
              rounded
              size="small"
              label="Disconnect"
              icon="pi pi-times"
              :loading="disconnectLoading"
              :disabled="locked"
              @click="disconnect()"
            />
            <Button
              rounded
              outlined
              size="small"
              label="Reset"
              icon="pi pi-refresh"
              :loading="resetLoading"
              :disabled="locked"
              @click="reset()"
            />
            <Button
              text
              rounded
              size="small"
              icon="pi pi-info-circle"
              aria-label="What does Reset do?"
              @mouseenter="resetInfo?.show($event)"
              @mouseleave="resetInfo?.hide()"
              @click="resetInfo?.toggle($event)"
            />
          </div>
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
    <Popover ref="resetInfo">
      <div class="max-w-xs text-sm">
        Closes the CAN connection, discovers the CAN networks again and
        reconnects to this network, if it is still available. Use it when the
        STU stops responding.
      </div>
    </Popover>
  </HardwareStep>
</template>
