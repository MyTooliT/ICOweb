<script setup lang="ts">
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
        <span class="pi pi-pencil" />
      </div>
      <div v-if="state === 'loading'">
        <span class="pi pi-spinner animate-spin" />
      </div>
      <div
        v-if="state === 'editing'"
        class="text-gray-400">
        <span class="pi pi-check-circle" />
      </div>
      <div v-if="state === 'readyToSave'">
        <span class="pi pi-check-circle" />
      </div>
    </slot>
  </button>
</template>

<style scoped>

</style>