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
import ToggleSwitch from 'primevue/toggleswitch';
import Select from 'primevue/select';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const store = useGeneralStore()
const state = store.systemState

const { loading: scanLoading, call: scan } = useLoadingHandler(getCANNetworks)
const { loading: connectLoading, call: connect } = useLoadingHandler(
  (network: CANNetwork) => connectCAN({
    interface: network.interface,
    channel: network.channel
  })
)
// Name of the unit of a network (multi STU support)
function unitName(network: CANNetwork): string {
  return `${network.interface}:${network.channel}`
}

// With several units, "Disconnect" removes the unit of that network only
const { loading: disconnectLoading, call: disconnect } = useLoadingHandler(
  (network?: CANNetwork) => disconnectCAN(
    state.multiUnit && network ? unitName(network) : undefined
  )
)

const { loading: resetLoading, call: reset } = useLoadingHandler(resetCAN)
const resetTooltip = 'Closes the CAN connection, discovers the CAN networks again and reconnects to this network, if it is still available.\n\nUse it when the STU stops responding.'

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
  // Every connected network is a unit
  if(state.multiUnit) {
    return (state.units ?? []).some(unit => unit.unit === unitName(network))
  }
  return state.canStatus === 'CONNECTED' && isSelected(network)
}

const unitCount = computed(() => state.units?.length ?? 0)
// With several units this panel only adds units: Networks that already are
// units are managed in the card of their unit.
const networks = computed(() => state.multiUnit
  ? state.canNetworks.filter(network => !isConnected(network))
  : state.canNetworks)
// The network chosen to be added (multi STU support)
const chosen = ref<CANNetwork | null>(null)
watch(networks, (available) => {
  if (!available.some(network => chosen.value && unitName(network) === unitName(chosen.value))) {
    chosen.value = available[0] ?? null
  }
}, { immediate: true })
function networkLabel(network: CANNetwork): string {
  return network.bitrate
    ? `${network.interface} · ${network.channel} · ${network.bitrate} bit/s`
    : `${network.interface} · ${network.channel}`
}

const panelStatus = computed(() => {
  if(state.multiUnit) {
    return networks.value.length === 0
      ? 'No further network'
      : `${networks.value.length} available`
  }
  return statusText[state.canStatus]
})
const panelDone = computed(() =>
  state.multiUnit ? false : state.canStatus === 'CONNECTED')

// Periodic discovery. It only runs while the API is not connected and is
// paused after a failed connection, so that the error stays visible until the
// user discovers or connects again.
let timer: number | null = null
const scanStates: CANStatus[] = ['NO_NETWORK', 'NETWORK_FOUND']

async function autoScan() {
  if (!store.canAutoScan || busy.value) return
  // With several units more networks can be added at any time
  if (state.multiUnit) {
    if (state.canStatus === 'ERROR') return
  } else if (!scanStates.includes(state.canStatus)) return
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
  <!-- Several units: a quiet card to add one more unit -->
  <section
    v-if="state.multiUnit"
    class="ico-card border-dashed !bg-transparent !shadow-none p-6 flex
      flex-col items-center gap-6 text-center"
    data-test="add-unit-card"
  >
    <div class="flex flex-col gap-1">
      <h2 class="font-medium text-lg">Add Unit</h2>
      <p class="ico-muted text-sm">
        Connect the API to the CAN network of another STU.
      </p>
    </div>
    <div class="flex flex-col items-center gap-3">
      <Button
        outlined
        label="Discover"
        icon="pi pi-sitemap"
        :loading="scanLoading"
        @click="scan()"
      />
      <label class="flex flex-row items-center gap-2 text-sm">
        <ToggleSwitch v-model="store.canAutoScan" />
        Discover automatically
      </label>
    </div>
    <p
      v-if="state.canError"
      class="text-error text-sm"
    >
      {{ state.canError }}
    </p>
    <template v-if="networks.length > 0">
      <Select
        v-model="chosen"
        :options="networks"
        :option-label="networkLabel"
        :disabled="locked"
        class="w-full max-w-sm"
        data-test="add-unit"
        aria-label="Network of the new unit"
      />
      <Button
        rounded
        label="Add"
        :loading="connectLoading"
        :disabled="locked || !chosen"
        @click="chosen && connect(chosen)"
      />
    </template>
    <p
      v-else
      class="ico-muted text-sm"
    >
      No further CAN network found. Plug in the adapter of the next STU.
    </p>
  </section>
  <HardwareStep
    v-else
    :step="1"
    :state="panelDone ? 'done' : 'current'"
    title="CAN Network"
    :subtitle="state.multiUnit
      ? 'Connect the API to the CAN network of another STU. The unit appears below and must be set up there.'
      : 'Discover CAN adapters and connect the API to one of them.'"
    :status="panelStatus"
    :severity="state.multiUnit ? 'secondary' : statusSeverity[state.canStatus]"
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
    <DataTable :value="networks">
      <template #empty>
        <template v-if="state.multiUnit && unitCount > 0">
          No further CAN network found. Plug in the adapter of the next STU
          and discover again.
        </template>
        <template v-else>
          No CAN network found. Check that the adapter is plugged in and,
          on Linux, that the interface is up.
        </template>
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
            v-if="!state.multiUnit && isConnected(data)"
            class="flex flex-row items-center gap-2"
          >
            <Button
              rounded
              size="small"
              label="Disconnect"
              icon="pi pi-times"
              severity="danger"
              :loading="disconnectLoading"
              :disabled="locked"
              @click="disconnect(data)"
            />
            <Button
              rounded
              outlined
              size="small"
              v-tooltip.top="{ value: resetTooltip }"
              label="Reset"
              icon="pi pi-refresh"
              :loading="resetLoading"
              :disabled="locked"
              @click="reset()"
            />
          </div>
          <Button
            v-else
            rounded
            size="small"
            :label="state.multiUnit ? 'Add unit' : 'Connect'"
            :icon="state.multiUnit ? 'pi pi-plus' : 'pi pi-link'"
            :loading="connectLoading && isSelected(data)"
            :disabled="locked"
            @click="connect(data)"
          />
        </template>
      </Column>
    </DataTable>
  </HardwareStep>
</template>
