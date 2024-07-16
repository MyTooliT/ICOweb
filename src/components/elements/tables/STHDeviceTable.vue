<script setup lang="ts">
import { Reactive } from 'vue';
import { STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';
import DeviceTable from './DeviceTable.vue';
import DeviceTableEntry from './DeviceTableEntry.vue';
import STHDeviceTableRow from './STHDeviceTableRow.vue';

defineProps<{
  devices: Reactive<STHDevice[]>
}>()
</script>

<template>
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
      :key="STH.getMac()"
      :device="STH as STHDevice"
    />
  </DeviceTable>
</template>

<style scoped>

</style>