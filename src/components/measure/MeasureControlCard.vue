<script setup lang="ts">
import ChartStreamControls from '@/components/inputs/ChartStreamControls.vue';
import ContentCard from '@/components/misc/ContentCard.vue';
import { TWebSocketState } from '@/stores/measurementStore/measurementStore.ts';
import { measurementChannels } from '@/stores/measurementStore/measurementStore.ts';
import { formatDuration, useElapsed } from '@/utils/useElapsed.ts';
import { useMeasureSlots } from '@/utils/useMeasureSlots.ts';
import { unitColor } from '@/utils/unitColors.ts';
import { format } from 'date-fns';
import { computed } from 'vue';

defineProps<{
  state: TWebSocketState
  ready: boolean
  startLoading: boolean
  stopLoading: boolean
}>()

defineEmits<{
  (e: 'start'): void
  (e: 'stop'): void
  (e: 'show'): void
  (e: 'hide'): void
}>()

const {
  running, runningStatus, runningInstructions, slots, slotsFor, slotRepr,
  iftRequested, iftChannel
} = useMeasureSlots()

const { startTime, elapsed } = useElapsed(computed(() => runningStatus.value?.start_time))

const duration = computed<string>(() => {
  const time = runningInstructions.value?.time
  return time ? formatDuration(time) : 'Until stopped'
})

/** The sensors of every channel, per unit with several units */
const channelGroups = computed(() => {
  const units = runningStatus.value?.units
  const describe = (unit: string | null) => measurementChannels
    .filter(slot => slotsFor(unit)[slot].active)
    .map(slot => slotRepr(slot, unit) || slotsFor(unit)[slot].sensorId || slot)
  if(units && units.length > 0) {
    return units.map(unit => ({
      name: unit.source,
      channels: describe(unit.unit)
    }))
  }
  return [{
    name: null,
    channels: measurementChannels
      .filter(slot => slots.value[slot].active)
      .map(slot => slotRepr(slot) || slots.value[slot].sensorId || slot)
  }]
})
</script>

<template>
  <ContentCard :title="running ? 'Running Measurement' : 'Control'">
    <dl
      v-if="runningStatus"
      class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mb-3"
    >
      <dt class="ico-muted">File</dt>
      <dd class="text-right font-mono [overflow-wrap:anywhere]">
        {{ runningStatus.name ?? '–' }}
      </dd>
      <dt class="ico-muted">Started</dt>
      <dd class="text-right">
        {{ startTime ? format(startTime, 'HH:mm:ss') : '–' }}
      </dd>
      <dt class="ico-muted">Elapsed</dt>
      <dd class="text-right font-mono">{{ elapsed ?? '–' }}</dd>
      <dt class="ico-muted">Duration</dt>
      <dd class="text-right">{{ duration }}</dd>
      <template v-if="iftRequested">
        <dt class="ico-muted">IFT</dt>
        <dd class="text-right">{{ slotRepr(iftChannel) || iftChannel }}</dd>
      </template>
    </dl>
    <!-- What every unit measures -->
    <div
      v-if="runningStatus"
      class="flex flex-col gap-3 border-t border-[var(--p-content-border-color)]
        pt-3 mb-3"
      data-test="running-channels"
    >
      <span class="ico-muted text-xs uppercase tracking-wide">Channels</span>
      <div
        v-for="(group, index) in channelGroups"
        :key="group.name ?? ''"
        class="flex flex-col gap-1"
        :class="group.name ? 'border-l-4 pl-3' : ''"
        :style="group.name ? { borderLeftColor: unitColor(index) } : undefined"
      >
        <span
          v-if="group.name"
          class="text-sm font-medium"
        >
          {{ group.name }}
        </span>
        <ul class="flex flex-col gap-0.5 text-sm">
          <li
            v-for="channel in group.channels"
            :key="channel"
            class="[overflow-wrap:anywhere]"
          >
            {{ channel }}
          </li>
        </ul>
      </div>
    </div>
    <ChartStreamControls
      :ready="ready"
      :state="state"
      :start-loading="startLoading"
      :stop-loading="stopLoading"
      @start="$emit('start')"
      @stop="$emit('stop')"
      @show="$emit('show')"
      @hide="$emit('hide')"
    />
  </ContentCard>
</template>
