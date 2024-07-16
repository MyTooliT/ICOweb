<script setup lang="ts">
import DeviceTableEntry from './DeviceTableEntry.vue';
import { EditState } from '../buttons/types';
import { STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';
import { Ref } from 'vue';
import EditableInput from '@/components/elements/inputs/EditableInput.vue';


const props = defineProps<{
  device: STHDevice
}>()

async function saveName(
  currentState: Ref<EditState>,
  content: string,
  focused: Ref<boolean>
): Promise<void> {
  console.log(currentState.value, content, focused.value);
  try {
    currentState.value = 'loading'
    await props.device.setName(content)
    currentState.value = 'readyToEdit'
    focused.value = false
  } catch(e) {
    currentState.value = 'readyToSave'
    console.error(e)
  }

}
</script>

<template>
  <tr
    class="border-b border-gray-200">
    <DeviceTableEntry>{{ device.getId() }}</DeviceTableEntry>
    <DeviceTableEntry>
      <EditableInput
        placeholder="ASDF"
        :disabled="false"
        :id="`${device.getMac()}`"
        :regex="STHDevice.nameRegex"
        :initial-value="device.getName()"
        :saveFn="saveName" />
    </DeviceTableEntry>
    <DeviceTableEntry>{{ device.getMac() }}</DeviceTableEntry>
    <DeviceTableEntry>{{ device.getRssiRepr() }}</DeviceTableEntry>
    <DeviceTableEntry>-</DeviceTableEntry>
    <DeviceTableEntry>-</DeviceTableEntry>
  </tr>
</template>

<style scoped>

</style>