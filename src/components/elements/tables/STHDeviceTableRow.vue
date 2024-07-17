<script setup lang="ts">
import EditableInput from '@/components/elements/inputs/EditableInput.vue';
import DeviceTableRow from './DeviceTableRow.vue';
import DeviceTableEntry from './DeviceTableEntry.vue';
import { STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';
import { Ref } from 'vue';
import { EditState } from '@/components/elements/buttons/types.ts';

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
  <DeviceTableRow>
    <DeviceTableEntry>{{ device.Meta().id }}</DeviceTableEntry>
    <td>
      <EditableInput
        :id="`${device.Meta().id}`"
        class="py-3 pr-3 flex flex-row items-center justify-start"
        placeholder="Device"
        :disabled="false"
        :regex="device.Meta().regex"
        :initial-value="device.Meta().name"
        :save-fn="saveName" />
    </td>
    <DeviceTableEntry>{{ device.Meta().mac }}</DeviceTableEntry>
    <DeviceTableEntry>{{ device.getRssiRepr() }}</DeviceTableEntry>
    <DeviceTableEntry>-</DeviceTableEntry>
    <DeviceTableEntry>-</DeviceTableEntry>
  </DeviceTableRow>
</template>

<style scoped>

</style>