<script setup lang="ts">
import {
  ArrowPathIcon,
  CheckCircleIcon,
  PencilIcon
} from '@heroicons/vue/16/solid';
import { EditState } from './types';

const props = withDefaults(defineProps<{
  state: EditState,
}>(), {
  state: 'readyToEdit'
});
const emits = defineEmits<{
  edit: [void],
  save: [void]
}>()
</script>

<template>
  <button
    class="p-1 grid grid-cols-1 place-content-center grid-rows-1"
    @click="(e) => {
      // Note:  the @click event should not be usable for the parent
      //        since this button should only ever be edit-save
      e.preventDefault();
      if(props.state === 'readyToEdit') {
        emits('edit', e)
      }
      else if(props.state === 'readyToSave') {
        emits('save', e)
      }
    }"
  >
    <slot>
      <div
        :data-state="state"
        class="
        z-0 opacity-0 col-start-1 row-start-1
        data-[state=readyToEdit]:z-10 data-[state=readyToEdit]:opacity-100">
        <PencilIcon
          class="size-6" />
      </div>
      <div
        :data-state="state"
        class="
        z-0 opacity-0 col-start-1 row-start-1
        data-[state=loading]:z-10 data-[state=loading]:opacity-100">
        <ArrowPathIcon
          class="size-6 animate-spin" />
      </div>
      <div
        :data-state="state"
        class="
        z-0 opacity-0  col-start-1 row-start-1
        data-[state=editing]:z-10 data-[state=editing]:opacity-100
        data-[state=editing]:text-gray-400
        data-[state=readyToSave]:z-10 data-[state=readyToSave]:opacity-100
        data-[state=readyToSave]:text-black">
        <CheckCircleIcon
          class="size-6" />
      </div>
    </slot>
  </button>
</template>

<style scoped>

</style>