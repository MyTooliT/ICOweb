<script setup lang="ts">
import { getAPILink } from '@/api/icoapi.ts';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import BaseBottomBar, { State } from '@base/components/bottom/BottomBar.vue';
import Button from 'primevue/button';
import Popover from 'primevue/popover';
import Tag from 'primevue/tag';
import { computed, onMounted } from 'vue';

const store = useGeneralStore();
const hardwareStore = useHardwareStore();

onMounted(async () => {
  await store.systemState.checkState()
})

function clearCache() {
  window?.localStorage?.clear()
}

const state = computed<State>(() => {
  const system = store.systemState
  if (system.running) return State.ACTIVE
  if (!system.reachable) return State.ERROR
  if (system.canStatus === 'ERROR') return State.ERROR
  if (system.canConnected) return State.IDLE
  return State.WARNING
})

// The status sections fill the whole height of the bar, so remove the
// padding at the bottom and right of the base bar and stretch its children
const layout = '!pb-0 !pr-0 !items-stretch'
const stateClassMap: Record<State, string> = {
  [State.ERROR]: `${layout} bg-error-container text-on-error-container`,
  [State.WARNING]: `${layout} bg-primary-container text-on-primary-container`,
  [State.IDLE]: `${layout} bg-primary-container text-on-primary-container`,
  [State.ACTIVE]: `${layout} bg-[var(--p-green-600)] text-white`
}

type Health = 'ok' | 'error' | 'unknown'

const healthIcon: Record<Health, string> = {
  ok: 'pi pi-check-circle',
  error: 'pi pi-times-circle',
  unknown: 'pi pi-question-circle'
}

const healthClass: Record<Health, string> = {
  ok: 'bg-primary text-on-primary',
  error: 'bg-error text-on-error',
  unknown: 'bg-[var(--p-amber-400)] text-black'
}

const healthSeverity: Record<Health, string> = {
  ok: 'success',
  error: 'danger',
  unknown: 'warn'
}

type DetailRow = {
  label: string
  value: string
  mono?: boolean
}

type StatusSection = {
  name: string
  title: string
  health: Health
  status: string
  rows: DetailRow[]
  hint?: string
}

function apiAddressRows(): DetailRow[] {
  try {
    const url = new URL(getAPILink())
    const rows: DetailRow[] = [{ label: 'Host', value: url.hostname, mono: true }]
    if (url.port) rows.push({ label: 'Port', value: url.port, mono: true })
    return rows
  } catch {
    return [{ label: 'Address', value: getAPILink(), mono: true }]
  }
}

const sections = computed<StatusSection[]>(() => {
  const system = store.systemState
  const network = system.canSelected
  const stu = hardwareStore.activeSTU
  const sth = system.sthConnected
  const canConnected = system.reachable && system.canStatus === 'CONNECTED'
  const stuResponsive = canConnected && system.stuConnected

  const api: StatusSection = {
    name: 'API',
    title: 'ICOapi',
    health: system.reachable ? 'ok' : 'error',
    status: system.reachable ? 'Reachable' : 'Not reachable',
    rows: apiAddressRows(),
    hint: system.reachable
      ? undefined
      : 'The API does not answer. Check that it is running.'
  }

  const can: StatusSection = {
    name: 'CAN',
    title: 'CAN network',
    health: 'unknown',
    status: 'Unknown',
    rows: []
  }
  if (!system.reachable) {
    can.hint = 'Unknown while the API is not reachable.'
  } else {
    switch (system.canStatus) {
      case 'CONNECTED':
        can.health = 'ok'
        can.status = 'Connected'
        break
      case 'CONNECTING':
        can.status = 'Connecting'
        break
      case 'NETWORK_FOUND':
        can.status = 'Not connected'
        can.hint = 'A network is available. Connect to it on the Devices page.'
        break
      case 'ERROR':
        can.health = 'error'
        can.status = 'Failed'
        can.hint = 'Check the CAN adapter, then connect again.'
        break
      default:
        can.health = 'error'
        can.status = 'No network'
        can.hint = 'No CAN adapter found. Plug it in and discover again.'
    }
  }
  if (system.reachable && network) {
    can.rows.push(
      { label: 'Interface', value: network.interface, mono: true },
      { label: 'Channel', value: network.channel, mono: true }
    )
    if (network.bitrate) {
      can.rows.push({ label: 'Bitrate', value: `${network.bitrate} bit/s` })
    }
  }
  if (system.reachable && system.canError) {
    can.rows.push({ label: 'Error', value: system.canError })
  }

  const stuSection: StatusSection = {
    name: 'STU',
    title: 'Stationary transceiver unit',
    health: canConnected ? (system.stuConnected ? 'ok' : 'error') : 'unknown',
    status: canConnected
      ? (system.stuConnected ? 'Connected' : 'Not connected')
      : 'Unknown',
    rows: [],
    hint: canConnected
      ? (system.stuConnected
        ? undefined
        : 'The STU does not answer. Try Reset in the CAN network table.')
      : 'Connect to a CAN network first.'
  }
  if (stu) {
    stuSection.rows.push(
      { label: 'Name', value: stu.getName() },
      { label: 'MAC', value: stu.getMacAddress(), mono: true }
    )
  }

  const sthSection: StatusSection = {
    name: 'STH',
    title: 'Sensor device',
    health: stuResponsive ? (sth ? 'ok' : 'error') : 'unknown',
    status: stuResponsive ? (sth ? 'Connected' : 'Not connected') : 'Unknown',
    rows: [],
    hint: stuResponsive
      ? (sth ? undefined : 'Connect a sensor device on the Devices page.')
      : 'Needs a connected STU.'
  }
  if (sth) {
    sthSection.rows.push(
      { label: 'Name', value: sth.name },
      { label: 'MAC', value: sth.mac_address, mono: true }
    )
  }

  return [api, can, stuSection, sthSection]
})

// One popover per section, opened while the pointer is over the section
const popovers = new Map<string, InstanceType<typeof Popover>>()

function setPopover(name: string, popover: unknown) {
  if (popover) popovers.set(name, popover as InstanceType<typeof Popover>)
  else popovers.delete(name)
}

function showDetails(name: string, event: Event) {
  popovers.forEach((popover, key) => {
    if (key !== name) popover.hide()
  })
  popovers.get(name)?.show(event)
}

function hideDetails(name: string) {
  popovers.get(name)?.hide()
}
</script>

<template>
  <BaseBottomBar
    :state="state"
    :state-class-map="stateClassMap"
    :status-infos="[]"
  >
    <template #left>
      <div class="bg-inherit text-inherit self-center">
        <Button
          label="Clear Cache"
          size="small"
          link
          class="!text-inherit"
          @click="clearCache()" />
      </div>
    </template>
    <div
      v-if="store.systemState.running"
      class="text-sm h-min flex self-center">
      Ongoing Measurement
    </div>
    <template #right>
      <div class="text-sm flex flex-row items-stretch gap-1.5">
        <div
          v-for="section in sections"
          :key="section.name"
          class="flex flex-row items-center gap-2 px-4 cursor-default
            transition-[filter] hover:brightness-110"
          :class="healthClass[section.health]"
          :aria-label="`${section.name}: ${section.status}`"
          @mouseenter="showDetails(section.name, $event)"
          @mouseleave="hideDetails(section.name)"
        >
          <span>{{ section.name }}</span>
          <span :class="healthIcon[section.health]" />
          <Popover :ref="(popover) => setPopover(section.name, popover)">
            <div class="flex flex-col gap-3 min-w-64 max-w-sm text-sm">
              <div class="flex flex-row items-center justify-between gap-4">
                <div class="flex flex-col">
                  <span class="font-semibold">{{ section.name }}</span>
                  <span class="text-xs opacity-70">{{ section.title }}</span>
                </div>
                <Tag
                  :severity="healthSeverity[section.health]"
                  :icon="healthIcon[section.health]"
                  :value="section.status"
                />
              </div>
              <dl
                v-if="section.rows.length > 0"
                class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t
                  border-[var(--p-content-border-color)] pt-3"
              >
                <template
                  v-for="row in section.rows"
                  :key="row.label"
                >
                  <dt class="opacity-70">{{ row.label }}</dt>
                  <dd
                    class="text-right [overflow-wrap:anywhere]"
                    :class="{ 'font-mono': row.mono }"
                  >
                    {{ row.value }}
                  </dd>
                </template>
              </dl>
              <p
                v-if="section.hint"
                class="text-xs opacity-80 border-t
                  border-[var(--p-content-border-color)] pt-3"
              >
                {{ section.hint }}
              </p>
            </div>
          </Popover>
        </div>
      </div>
    </template>
  </BaseBottomBar>
</template>
