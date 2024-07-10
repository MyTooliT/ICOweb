<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import Heading5 from '@/components/typography/heading/Heading5.vue';
import OutlineButton from '@/components/elements/buttons/OutlineButton.vue';
import { ref, Ref, UnwrapRef } from 'vue';

/* eslint-disable max-len */
import { MockSTHActions, STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';

const devices: Ref<UnwrapRef<STHDevice[]>> = ref([
  new STHDevice(1, 'Messerkopf', 'AA:BB:CC:DD:EE:FF', 0, new MockSTHActions()),
  new STHDevice(2, 'Messerkopf', 'AA:BB:CC:DD:EE:00', 0, new MockSTHActions())
])
/* eslint-enable max-len*/

</script>

<template>
  <DefaultLayout>
    <div class="flex flex-row justify-between">
      <Heading5>Sensory Tool Holders</Heading5>
      <OutlineButton>Reload</OutlineButton>
    </div>
    <table>
      <thead>
        <tr>
          <td>#</td>
          <td>Name</td>
          <td>MAC</td>
          <td>RSSI</td>
          <td>Default Sensor Config</td>
          <td>Action</td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="STHDevice in devices" :key="STHDevice.getMac()">
          <td>{{ STHDevice.getId() }}</td>
          <td>{{ STHDevice.getName() }}</td>
          <td>{{ STHDevice.getMac() }}</td>
          <td>{{ STHDevice.getRssi() }}</td>
          <td>-</td>
          <td>-</td>
        </tr>
        </tbody>
    </table>
  </DefaultLayout>
</template>

<style scoped>

</style>