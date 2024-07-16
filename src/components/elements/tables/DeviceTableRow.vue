<script setup lang="ts">
import EditButton from '../buttons/EditButton.vue';
import DeviceTableEntry from './DeviceTableEntry.vue';
import { EditState } from '../buttons/types';
import { STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';
import {
  computed,
  ComputedRef,
  nextTick,
  ref,
  Ref
} from 'vue';
import {
  MaybeElementRef,
  onClickOutside,
  useFocus
} from '@vueuse/core';
import {
  HTMLDivElement,
  HTMLInputElement
} from 'happy-dom';

const props = defineProps<{
  device: STHDevice
}>()

const currentState: Ref<EditState> = ref('readyToEdit')
const name: Ref<string> = ref(props.device.getName())

const editContainer: Ref<HTMLDivElement | null> = ref(null)
const inputRef: Ref<HTMLInputElement | null> = ref(null)

onClickOutside(editContainer as MaybeElementRef, () => {
  name.value = props.device.getName()
  currentState.value = 'readyToEdit'
})

const { focused } = useFocus(inputRef as MaybeElementRef, {
  focusVisible: true
})

const nameValid: ComputedRef<boolean> = computed(() => {
  return STHDevice.nameRegex.test(name.value)
})

function editName(): void {
  currentState.value = 'editing'
  nextTick(() => {
    focused.value = true
  })
}

async function saveName(): Promise<void> {
  if(nameValid.value) {
    try {
      currentState.value = 'loading'
      await props.device.setName(name.value)
      currentState.value = 'readyToEdit'
      focused.value = false
    } catch(e) {
      currentState.value = 'readyToSave'
      console.error(e)
    }
  }
}
</script>

<template>
  <tr
    class="border-b border-gray-200">
    <DeviceTableEntry>{{ device.getId() }}</DeviceTableEntry>
    <DeviceTableEntry ref="editContainer">
      <input
        :id="`name-${device.getMac()}`"
        ref="inputRef"
        v-model="name"
        type="text"
        placeholder="Device Name"
        :disabled="currentState == 'readyToEdit'"
        @input="() => {
          currentState = nameValid ? 'readyToSave' : 'editing'
        }"
        @keyup.enter="() => {
          nameValid ? saveName() : () => {}
        }"
      >
      <EditButton
        :state="currentState"
        :disabled="currentState == 'editing' || currentState == 'disabled'"
        @edit="editName"
        @save="saveName"
      />
    </DeviceTableEntry>
    <DeviceTableEntry>{{ device.getMac() }}</DeviceTableEntry>
    <DeviceTableEntry>{{ device.getRssiRepr() }}</DeviceTableEntry>
    <DeviceTableEntry>-</DeviceTableEntry>
    <DeviceTableEntry>-</DeviceTableEntry>
  </tr>
</template>

<style scoped>

</style>