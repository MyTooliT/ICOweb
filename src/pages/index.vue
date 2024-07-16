<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import Heading3 from '@/components/typography/heading/Heading3.vue';
import OutlineButton from '@/components/elements/buttons/OutlineButton.vue';
import {
  reactive,
  Reactive
} from 'vue';

/* eslint-disable max-len */
import {
  MockSTHActions,
  STHDevice
} from '@/stores/hardwareStore/classes/STHDevice.ts';
import STHDeviceTable from '@/components/elements/tables/STHDeviceTable.vue';

const devices: Reactive<STHDevice[]> = reactive([
  new STHDevice(1, 'Messerkopf', 'AA:BB:CC:DD:EE:FF', 0, new MockSTHActions()),
  new STHDevice(2, 'Messerkopf', 'AA:BB:CC:DD:EE:00', 0, new MockSTHActions())
])
/* eslint-enable max-len*/

</script>

<template>
  <DefaultLayout>
    <div class="flex flex-row justify-between">
      <Heading3>Sensory Tool Holders</Heading3>
      <OutlineButton>Reload</OutlineButton>
    </div>
    <STHDeviceTable :devices="devices" />
  </DefaultLayout>
</template>

<style scoped>

</style>