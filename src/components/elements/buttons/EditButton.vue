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
    class="relative aspect-square"
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
      <div v-if="state === 'readyToEdit'">
        <PencilIcon class="size-6" />
      </div>
      <div v-if="state === 'loading'">
        <ArrowPathIcon class="size-6 animate-spin" />
      </div>
      <div
        v-if="state === 'editing'"
        class="text-gray-400">
        <CheckCircleIcon
          class="size-6" />
      </div>
      <div v-if="state === 'readyToSave'">
        <CheckCircleIcon class="size-6" />
      </div>
    </slot>
  </button>
</template>

<style scoped>

</style>