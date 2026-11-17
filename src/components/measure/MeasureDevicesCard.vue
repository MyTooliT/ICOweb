<script setup lang="ts">
import ContentCard from '@/components/misc/ContentCard.vue';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useMeasureSlots } from '@/utils/useMeasureSlots.ts';
import Button from 'primevue/button';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter()
const hwStore = useHardwareStore()
const gStore = useGeneralStore()
const { running, runningStatus, connectedSTH, units, multiUnit } = useMeasureSlots()

const supplyVoltage = computed<string>(() => {
  if(running.value) {
    const voltage = runningStatus.value?.start_supply_voltage
    return voltage === null || voltage === undefined
      ? 'N/A'
      : `${voltage.toFixed(2)}V (at start)`
  }
  return hwStore.activeSTH?.getSupplyVoltageRepr() ?? 'N/A'
})

/** What is known about the units: the connections, or the running measurement */
const rows = computed(() => (units.value ?? []).map(unit => {
  const measuring = runningStatus.value?.units?.find(
    entry => entry.unit === unit.unit)
  return {
    unit: unit.unit,
    stu: hwStore.stuListFor(unit.unit)[0]?.getName() ?? '–',
    sth: unit.sth_connected?.name ?? measuring?.tool_name ?? '–',
    mac: unit.sth_connected?.mac_address ?? measuring?.sth_mac_address ?? null,
    voltage: running.value
      ? null
      : hwStore.activeSTHFor(unit.unit)?.getSupplyVoltageRepr() ?? 'N/A',
    stuOk: unit.stu_connected
  }
}))
</script>

<template>
  <ContentCard :title="multiUnit ? 'Units' : 'Devices'">
    <template #actions>
      <Button
        v-tooltip.left="'Manage devices'"
        icon="pi pi-cog"
        size="small"
        text
        rounded
        aria-label="Manage devices"
        :disabled="gStore.systemState.running"
        @click="router.push('/')"
      />
    </template>
    <div
      v-if="multiUnit"
      class="flex flex-col gap-3"
    >
      <dl
        v-for="row in rows"
        :key="row.unit"
        class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm"
        data-test="unit-row"
      >
        <dt class="font-medium col-span-2">{{ row.unit }}</dt>
        <dt class="ico-muted">STU</dt>
        <dd class="text-right">
          {{ row.stu }}
          <i
            v-if="!row.stuOk"
            class="pi pi-exclamation-triangle text-error"
            aria-label="Not responding"
          />
        </dd>
        <dt class="ico-muted">STH</dt>
        <dd class="text-right">{{ row.sth }}</dd>
        <template v-if="row.mac">
          <dt class="ico-muted">MAC</dt>
          <dd class="text-right font-mono">{{ row.mac }}</dd>
        </template>
        <template v-if="row.voltage !== null">
          <dt class="ico-muted">Supply voltage</dt>
          <dd class="text-right">{{ row.voltage }}</dd>
        </template>
      </dl>
      <p
        v-if="running"
        class="text-sm ico-muted"
      >
        Supply voltage at start: {{ supplyVoltage }} (lowest of all units)
      </p>
    </div>
    <dl
      v-else
      class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm"
    >
      <dt class="ico-muted">STU</dt>
      <dd class="text-right">{{ hwStore.activeSTU?.getName() ?? '–' }}</dd>
      <dt class="ico-muted">STH</dt>
      <dd class="text-right">
        {{ connectedSTH?.name ?? runningStatus?.tool_name ?? '–' }}
      </dd>
      <template v-if="connectedSTH">
        <dt class="ico-muted">MAC</dt>
        <dd class="text-right font-mono">{{ connectedSTH.mac_address }}</dd>
      </template>
      <dt class="ico-muted">Supply voltage</dt>
      <dd class="text-right">{{ supplyVoltage }}</dd>
    </dl>
  </ContentCard>
</template>
