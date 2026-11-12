<script setup lang="ts">
import InputNumber from 'primevue/inputnumber';
import ToggleSwitch from 'primevue/toggleswitch';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import Button from 'primevue/button';
import {TWebSocketState, useMeasurementStore} from '@/stores/measurementStore/measurementStore.ts';
import {useGeneralStore} from '@/stores/generalStore/generalStore.ts';

const mStore = useMeasurementStore()
const gStore = useGeneralStore()

defineProps<{
  state: TWebSocketState,
  startLoading: boolean,
  stopLoading: boolean,
  ready: boolean
}>()

const emit = defineEmits(['start', 'stop', 'show', 'hide'])

const options: Array<{
  id: string
  model: 'continuous' | 'autostream' | 'disconnectAfterMeasurement'
  label: string
  tooltip: string
}> = [
  {
    id: 'continuous',
    model: 'continuous',
    label: 'Manual stop',
    tooltip: 'Manual stop will let the measurement run until the user stops it manually.\n\nDisabling this will stop the measurement after the acquisition time is reached.'
  },
  {
    id: 'autostream',
    model: 'autostream',
    label: 'Show data on start',
    tooltip: 'Immediately show the data in the graph on start.\n\nDisabling this will start the measurement but not display the data.'
  },
  {
    id: 'disconnect',
    model: 'disconnectAfterMeasurement',
    label: 'Disconnect after measurement',
    tooltip: 'Disconnect the tool after the measurement is finished for inspection. Disabling this will keep the tool connected.'
  }
]
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-col gap-2 text-sm">
      <label
        v-for="option in options"
        :key="option.id"
        :for="option.id"
        class="flex flex-row items-center gap-2"
      >
        <ToggleSwitch
          v-model="mStore[option.model]"
          :disabled="gStore.systemState.running"
          :input-id="option.id" />
        {{ option.label }}
        <i
          v-tooltip.left="{ value: option.tooltip }"
          class="pi pi-info-circle ico-muted" />
      </label>
    </div>
    <InputGroup>
      <InputNumber
        v-if="
          (gStore.systemState.running && !mStore.continuous)
            || !gStore.systemState.running"
        v-model="mStore.acquisitionTime"
        input-id="acqTime"
        aria-label="Acquisition time in seconds"
        :min="0"
        :disabled="mStore.continuous"
        :use-grouping="false"
        class="!w-min"
      />
      <InputGroupAddon
        v-if="
          (gStore.systemState.running && !mStore.continuous)
            || !gStore.systemState.running"
        :disabled="mStore.continuous"
      >
        s
      </InputGroupAddon>
      <Button
        v-if="gStore.systemState.running && state !== 'open'"
        label="Show Stream"
        severity="success"
        class="!px-5"
        @click="emit('show')"
      />
      <Button
        v-if="gStore.systemState.running && state === 'open'"
        label="Hide Stream"
        severity="primary"
        outlined
        class="!px-5"
        @click="emit('hide')"
      />
      <Button
        v-if="gStore.systemState.running"
        label="Stop"
        :loading="stopLoading"
        severity="danger"
        class="!px-5"
        :disabled="!gStore.systemState.running"
        @click="emit('stop')"
      />
      <Button
        v-if="!gStore.systemState.running"
        fluid
        label="Start Recording"
        :loading="startLoading"
        severity="primary"
        class="!px-5"
        :disabled="!ready || gStore.systemState.running"
        @click="emit('start')"
      />
    </InputGroup>
  </div>
</template>
