<script setup lang="ts">
import { disconnectCAN, resetCAN } from '@/api/icoapi.ts';
import STHDeviceTable from '@/components/tables/STHDeviceTable.vue';
import { UnitStateModel } from '@/client';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { useMessageBus } from '@/message';
import { useDisable } from '@/utils/useDisable.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import { unitColor, unitLabel } from '@/utils/unitColors.ts';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { computed } from 'vue';

/**
 * One unit (multi STU support) with everything needed to make it ready:
 *
 * 1. Network: the unit exists because its CAN network is connected
 * 2. STU: attach the one STU of the network
 * 3. Discover the sensor devices (STH) the STU can see
 * 4. Connect one of them
 *
 * Units are independent of each other and measure at the same time.
 */
const props = defineProps<{
  unit: UnitStateModel
  /** Position of the unit (starting with 1) */
  index: number
}>()

const store = useHardwareStore()
const general = useGeneralStore()
const m = useMessageBus()
const { featureEnabled } = useDisable()

const name = computed(() => props.unit.unit)
const stu = computed(() => store.stuListFor(name.value)[0])
const sthList = computed(() => store.sthListFor(name.value))
const connectedSTH = computed(() => props.unit.sth_connected ?? null)
const stuReady = computed(() => props.unit.stu_connected && !!stu.value)

const { loading: STULoading, call: attachSTU } = useLoadingHandler(async () => {
  await store.updateSTUDeviceList(name.value)
  if(!store.stuListFor(name.value)[0]) {
    m.error(
      `No STU found for ${name.value}`,
      'This can happen if the CAN bus is busy or if the STU is not connected.'
    )
  }
})
const { loading: STHLoading, call: discoverSTH } = useLoadingHandler(
  async () => {
    await store.refetchSensorsAndHolders()
    await store.updateSTHDeviceList(store.defaultHolderID, name.value)
    if(store.sthListFor(name.value).length === 0) {
      m.error(
        `No STH found for ${name.value}`,
        'Make sure the device you want to connect to is charged and in range.'
      )
    }
  }
)
const { loading: disconnectLoading, call: disconnect } = useLoadingHandler(
  () => disconnectCAN(name.value)
)
const { loading: resetLoading, call: reset } = useLoadingHandler(resetCAN)
const { loading: resetSTULoading, call: resetSTU } = useLoadingHandler(
  async () => { await stu.value?.reset() }
)
const { loading: otaLoading, call: toggleOTA } = useLoadingHandler(
  async (enable: boolean) => {
    if(enable) await stu.value?.enableOTA()
    else await stu.value?.disableOTA()
  }
)

const locked = computed(() => general.systemState.running)

type StepState = 'done' | 'current' | 'upcoming'
const steps = computed<{ label: string, state: StepState }[]>(() => {
  const stuState: StepState = stuReady.value ? 'done' : 'current'
  const discovered = sthList.value.length > 0 || !!connectedSTH.value
  return [
    { label: 'Network', state: 'done' },
    { label: 'Attach STU', state: stuState },
    {
      label: 'Discover STH',
      state: !stuReady.value ? 'upcoming' : (discovered ? 'done' : 'current')
    },
    {
      label: 'Connect STH',
      state: !stuReady.value
        ? 'upcoming'
        : (connectedSTH.value ? 'done' : (discovered ? 'current' : 'upcoming'))
    }
  ]
})

const status = computed(() => {
  if(!props.unit.stu_connected) {
    return { label: 'STU not responding', severity: 'danger' }
  }
  if(!stu.value) return { label: 'Attach the STU', severity: 'warn' }
  if(connectedSTH.value) {
    return { label: `Connected to ${connectedSTH.value.name}`, severity: 'success' }
  }
  return { label: 'No sensor device', severity: 'warn' }
})

const stepClass: Record<StepState, string> = {
  done: 'bg-primary border-primary text-on-primary',
  current: 'border-primary text-primary',
  upcoming: 'border-outline-variant text-on-surface-variant'
}
</script>

<template>
  <section
    class="ico-card overflow-hidden"
    :style="{ borderLeft: `6px solid ${unitColor(index - 1)}` }"
    data-test="unit-card"
  >
    <header class="flex flex-row flex-wrap items-start gap-4 p-5">
      <span
        class="flex items-center justify-center shrink-0 w-9 h-9 rounded-full
          font-medium text-white"
        :style="{ backgroundColor: unitColor(index - 1) }"
        aria-hidden="true"
      >
        {{ unitLabel(index - 1) }}
      </span>
      <div class="grow min-w-0">
        <div class="flex flex-row flex-wrap items-center gap-3">
          <h2 class="font-medium text-xl">Unit {{ unit.unit }}</h2>
          <Tag
            :value="status.label"
            :severity="status.severity"
          />
        </div>
        <p class="ico-muted text-sm">
          {{ unit.network.interface }} · {{ unit.network.channel }}
          <template v-if="unit.network.bitrate">
            · {{ unit.network.bitrate }} bit/s
          </template>
        </p>
      </div>
      <div class="flex flex-row items-center gap-2 shrink-0">
        <Button
          rounded
          outlined
          size="small"
          data-test="unit-reset"
          label="Reset"
          icon="pi pi-refresh"
          v-tooltip.top="{ value: 'Closes the CAN connections, discovers the networks again and reconnects. Affects all units. Use it when an STU stops responding.' }"
          :loading="resetLoading"
          :disabled="locked"
          @click="reset()"
        />
        <Button
          rounded
          size="small"
          data-test="unit-disconnect"
          label="Disconnect"
          icon="pi pi-times"
          severity="danger"
          :loading="disconnectLoading"
          :disabled="locked"
          @click="disconnect()"
        />
      </div>
    </header>

    <!-- The sequence inside one unit -->
    <ol
      class="flex flex-row flex-wrap items-center gap-2 px-5 pb-4 text-sm"
      aria-label="Steps of this unit"
      data-test="unit-pipeline"
    >
      <template
        v-for="(step, i) in steps"
        :key="step.label"
      >
        <li
          v-if="i > 0"
          aria-hidden="true"
        >
          <i class="pi pi-arrow-right text-xs opacity-60" />
        </li>
        <li
          class="flex flex-row items-center gap-2"
          :data-state="step.state"
        >
          <span
            class="flex items-center justify-center w-6 h-6 rounded-full
              border-2 text-xs font-medium"
            :class="stepClass[step.state]"
          >
            <i
              v-if="step.state === 'done'"
              class="pi pi-check"
            />
            <template v-else>{{ i + 1 }}</template>
          </span>
          <span :class="step.state === 'upcoming' ? 'opacity-60' : ''">
            {{ step.label }}
          </span>
        </li>
      </template>
    </ol>

    <!-- 2. The STU of the network (there is only one) -->
    <div
      class="flex flex-row flex-wrap items-center gap-4 px-5 py-3 border-t
        border-[var(--p-content-border-color)]"
      data-test="unit-stu"
    >
      <div class="grow min-w-0">
        <span class="font-medium">STU</span>
        <span
          v-if="stu"
          class="ml-3"
        >
          {{ stu.getName() }}
          <span class="font-mono ico-muted text-sm ml-2">
            {{ stu.getMacAddress() }}
          </span>
        </span>
        <span
          v-else
          class="ml-3 ico-muted"
        >
          Not attached
        </span>
      </div>
      <div class="flex flex-row flex-wrap items-center gap-2">
        <Button
          outlined
          rounded
          size="small"
          data-test="unit-stu-load"
          :label="stu ? 'Reload STU' : 'Attach STU'"
          icon="pi pi-sync"
          :loading="STULoading"
          @click="attachSTU()"
        />
        <Button
          v-if="stu"
          outlined
          rounded
          size="small"
          label="Reset STU"
          icon="pi pi-refresh"
          :loading="resetSTULoading"
          @click="resetSTU()
            .then(() => m.info('Reset Successful'))
            .catch((e: Error) => m.error(e.name, e.message))"
        />
        <template v-if="stu && featureEnabled('OTA')">
          <Button
            outlined
            rounded
            size="small"
            label="Enable OTA"
            icon="pi pi-sync"
            :loading="otaLoading"
            :disabled="['enabled', 'disabling'].includes(stu.getOTAState())"
            @click="toggleOTA(true)"
          />
          <Button
            outlined
            rounded
            size="small"
            label="Disable OTA"
            icon="pi pi-sync"
            :loading="otaLoading"
            :disabled="['disabled', 'enabling'].includes(stu.getOTAState())"
            @click="toggleOTA(false)"
          />
        </template>
      </div>
    </div>

    <!-- 3. and 4. Sensor devices: discover, then connect one -->
    <div class="border-t border-[var(--p-content-border-color)]">
      <div class="flex flex-row flex-wrap items-center gap-4 px-5 py-3">
        <span class="font-medium grow">Sensor devices (STH)</span>
        <Button
          rounded
          size="small"
          data-test="unit-discover-sth"
          label="Discover STH"
          icon="pi pi-wifi"
          :loading="STHLoading"
          :disabled="!stuReady"
          @click="discoverSTH()"
        />
      </div>
      <p
        v-if="!stuReady"
        class="ico-muted text-sm px-5 pb-4"
      >
        Attach the STU of this unit first.
      </p>
      <p
        v-else-if="sthList.length === 0"
        class="ico-muted text-sm px-5 pb-4"
      >
        Discover the sensor devices this STU can see.
      </p>
      <STHDeviceTable
        v-else
        :unit="unit.unit"
      />
    </div>
  </section>
</template>
