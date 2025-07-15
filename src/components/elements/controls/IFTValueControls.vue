<script setup lang="ts">

import NamedInput from '@/components/elements/forms/NamedInput.vue';
import InputGroup from 'primevue/inputgroup';
import CustomSlider from '@/components/elements/forms/CustomSlider.vue';
import Checkbox from 'primevue/checkbox';
import InputGroupAddon from 'primevue/inputgroupaddon';
import Select from 'primevue/select';
import {measurementChannels, useMeasurementStore} from '@/stores/measurementStore/measurementStore.ts';
import {useGeneralStore} from '@/stores/generalStore/generalStore.ts';
import {useHardwareStore} from '@/stores/hardwareStore/hardwareStore.ts';
import {computed, watch} from 'vue';

const mStore = useMeasurementStore()
const gStore = useGeneralStore()
const hwStore = useHardwareStore()

const possibleIFTChannels = computed<Array<string>>(() => {
  return Object.entries(mStore.activeChannels).filter(channel => channel[1]).map(channel => channel[0])
})

watch(mStore.activeChannels, () => {
  if(!(possibleIFTChannels.value && mStore.IFTChannel)) return
  if(!possibleIFTChannels.value.includes(mStore.IFTChannel)) {
    mStore.IFTChannel = measurementChannels[0]
  }
}, {
  deep: true,
})
</script>

<template>
  <NamedInput
    title="IFT Value"
    class="w-fit">
    <InputGroup class="w-fit">
      <InputGroupAddon class="w-12">
        <Checkbox
          v-model="mStore.IFTRequested"
          binary
          :disabled="gStore.systemState.running"
        />
      </InputGroupAddon>
      <InputGroupAddon>
        <span class="capitalize !text-black inline-block w-24">
          For Channel:
        </span>
      </InputGroupAddon>
      <Select
        v-model="mStore.IFTChannel"
        :options="possibleIFTChannels"
        :disabled="!hwStore.activeHolder || gStore.systemState.running"
        placeholder="Disabled"
      />
    </InputGroup>
    <InputGroup>
      <CustomSlider
        v-model="mStore.windowWidth"
        class="w-full"
        title="Window Size"
        :min="50"
        :max="250"
        :disabled="gStore.systemState.running"
      />
    </InputGroup>
  </NamedInput>
</template>
