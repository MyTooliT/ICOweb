<script setup lang="ts">
import ContentCard from '@/components/misc/ContentCard.vue';
import { TAssignedSensor } from '@/stores/hardwareStore/classes/HolderConfig.ts';
import {
  measurementChannels,
  useMeasurementStore
} from '@/stores/measurementStore/measurementStore.ts';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useMeasureSlots } from '@/utils/useMeasureSlots.ts';
import Checkbox from 'primevue/checkbox';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import Select from 'primevue/select';

const mStore = useMeasurementStore()
const gStore = useGeneralStore()
const { holder, holderOf, units, multiUnit, sensorRepr } = useMeasureSlots()

/** Number of channels the holder has (at most 3) */
function channelCount(unit: string | null): number {
  return holderOf(unit)?.sensors.length ?? 2
}
</script>

<template>
  <ContentCard title="Channels">
    <!-- One unit: the channels of the sensor device -->
    <div
      v-if="!multiUnit"
      class="flex flex-col gap-2"
    >
      <InputGroup
        v-for="slot in measurementChannels.slice(0, holder?.sensors.length ?? 2)"
        :key="slot"
      >
        <InputGroupAddon class="w-12">
          <Checkbox
            v-model="mStore.activeChannels[slot]"
            binary
            :aria-label="`Use ${slot} channel`"
            :disabled="slot === 'first'"
          />
        </InputGroupAddon>
        <Select
          v-model="mStore.selectedChannels[slot]"
          :data-test="`channel-select-${slot}`"
          :options="holder?.sensors ?? []"
          :option-value="(sens: TAssignedSensor) => sens.sensor.sensor_id"
          :option-label="sensorRepr"
          :disabled="!mStore.activeChannels[slot] || gStore.systemState.running"
          placeholder="No Selection"
        />
      </InputGroup>
    </div>

    <!-- Several units: every unit has its own channels and sensors (its
         holder may differ) -->
    <div
      v-else
      class="flex flex-col gap-3"
    >
      <p class="text-xs ico-muted">
        Every unit can measure a different number of channels. Choose the
        channels and sensors for each unit.
      </p>
      <div
        v-for="unit in units ?? []"
        :key="unit.unit"
        class="flex flex-col gap-2"
        data-test="unit-channels"
      >
        <div class="text-sm font-medium">
          {{ unit.sth_connected?.name ?? unit.unit }}
          <span class="ico-muted text-xs">{{ unit.unit }}</span>
        </div>
        <InputGroup
          v-for="slot in measurementChannels.slice(0, channelCount(unit.unit))"
          :key="slot"
        >
          <InputGroupAddon class="w-12">
            <Checkbox
              v-if="mStore.unitActive[unit.unit]"
              v-model="mStore.unitActive[unit.unit][slot]"
              binary
              :aria-label="`Use ${slot} channel of ${unit.unit}`"
              :disabled="slot === 'first' || gStore.systemState.running"
            />
          </InputGroupAddon>
          <Select
            v-if="mStore.unitChannels[unit.unit] && mStore.unitActive[unit.unit]"
            v-model="mStore.unitChannels[unit.unit][slot]"
            :data-test="`channel-select-${unit.unit}-${slot}`"
            :options="holderOf(unit.unit)?.sensors ?? []"
            :option-value="(sens: TAssignedSensor) => sens.sensor.sensor_id"
            :option-label="sensorRepr"
            :disabled="!mStore.unitActive[unit.unit]?.[slot] || gStore.systemState.running"
            placeholder="No Selection"
          />
        </InputGroup>
      </div>
    </div>
  </ContentCard>
</template>
