<script setup lang="ts">
import InputNumber from 'primevue/inputnumber';
import NamedInput from '@/components/elements/forms/NamedInput.vue';
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
</script>

<template>
  <NamedInput title="Measurement Control">
    <div class="flex flex-col gap-2 flex-wrap">
      <div class="flex flex-row">
        <ToggleSwitch
          v-model="mStore.continuous"
          :disabled="gStore.systemState.running"
          input-id="continuous" />
        <label
          for="continuous"
          class="ml-3">Run&nbsp;continuously</label>
      </div>
      <div class="flex flex-row">
        <ToggleSwitch
          v-model="mStore.autostream"
          :disabled="gStore.systemState.running"
          input-id="continuous" />
        <label
          for="continuous"
          class="ml-3">Auto-connect to stream</label>
      </div>
      <div class="flex flex-row">
        <ToggleSwitch
          v-model="mStore.disconnectAfterMeasurement"
          :disabled="gStore.systemState.running"
          input-id="disconnect" />
        <label
          for="disconnect"
          class="ml-3">Disconnect after measurement</label>
      </div>
    </div>
    <InputGroup>
      <InputNumber
        v-if="
          (gStore.systemState.running && !mStore.continuous)
            || !gStore.systemState.running"
        v-model="mStore.acquisitionTime"
        input-id="acqTime"
        :min="0"
        :disabled="mStore.continuous"
        :use-grouping="false"
        class="!w-min"
      />
      <InputGroupAddon
        v-if="
          (gStore.systemState.running && !mStore.continuous)
            || !gStore.systemState.running"
        class="!text-black"
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
  </NamedInput>
</template>