<script setup lang="ts">
import { ref } from 'vue';
import {
  MockSTHActions,
  STHDevice
} from '@/stores/hardwareStore/classes/STHDevice.ts';
import DeviceTable from './DeviceTable.vue';
import DeviceTableEntry from './DeviceTableEntry.vue';
import STHDeviceTableRow from './STHDeviceTableRow.vue';
import { getSTHDevicesMeta } from '@/api/requests.ts';

const devices = ref<STHDevice[]>([])
const devs = await getSTHDevicesMeta();
devs.forEach(entry => {
  devices.value.push(
    new STHDevice(entry, new MockSTHActions()),
  );
})
</script>

<template>
  <!--  <pre>
    {{ devices }}
  </pre>-->
  <DeviceTable :devices="devices">
    <template #head>
      <tr class="py-2">
        <DeviceTableEntry>#</DeviceTableEntry>
        <DeviceTableEntry>Name</DeviceTableEntry>
        <DeviceTableEntry>MAC</DeviceTableEntry>
        <DeviceTableEntry>RSSI</DeviceTableEntry>
        <DeviceTableEntry>Default Sensor Config</DeviceTableEntry>
        <DeviceTableEntry>Action</DeviceTableEntry>
      </tr>
    </template>
    <STHDeviceTableRow
      v-for="STH in devices"
      :key="STH.Meta().mac"
      :device="STH as STHDevice"
    />
  </DeviceTable>
</template>

<style scoped>

</style>