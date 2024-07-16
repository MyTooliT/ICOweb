<script setup lang="ts">
import EditButton from '@/components/elements/buttons/EditButton.vue';
import {
  computed,
  ComputedRef,
  nextTick,
  ref,
  Ref
} from 'vue';
import { EditState } from '@/components/elements/buttons/types.ts';
import {
  MaybeElementRef,
  onClickOutside,
  useFocus
} from '@vueuse/core';

const props = withDefaults(defineProps<{
  id: string,
  placeholder: string,
  disabled: boolean,
  regex: RegExp,
  initialValue: string,
  saveFn: (state: Ref<EditState>, content: string, focused: Ref<boolean>)
    => Promise<void>
}>(), {
  placeholder: 'Enter value...',
  disabled: false,
  initialValue: ''
})

const content: Ref<string> = ref(props.initialValue)
const currentState: Ref<EditState> = ref('readyToEdit')
const editContainer: Ref<HTMLDivElement | null> = ref(null)
const inputRef: Ref<HTMLInputElement | null> = ref(null)

onClickOutside(editContainer as MaybeElementRef, () => {
  currentState.value = 'readyToEdit'
  emits('blur')
})

const { focused } = useFocus(inputRef as MaybeElementRef, {
  focusVisible: true
})

const contentValid: ComputedRef<boolean> = computed(() => {
  return props.regex.test(content.value)
})

const emits = defineEmits<{
  blur: [void],
  edit: [string],
  save: [string]
}>()

function edit(): void {
  currentState.value = 'editing';
  nextTick(() => {
    focused.value = true
  })
  emits('edit', content.value)
}

function save(): void {
  props.saveFn(currentState, content.value, focused)
}

</script>

<template>
  <div ref="editContainer">
    <input
      :id="id"
      ref="inputRef"
      v-model="content"
      type="text"
      :placeholder="placeholder"
      :disabled="currentState == 'readyToEdit'"
      @input="() => {
        currentState = contentValid ? 'readyToSave' : 'editing'
      }"
      @keyup.enter="() => {
        contentValid ? save() : () => {}
      }"
    >
    <EditButton
      :state="currentState"
      :disabled="currentState == 'editing' || currentState == 'disabled'"
      @edit="edit"
      @save="save"
    />
  </div>
</template>

<style scoped>

</style>