<script setup lang="ts">
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useTextInput } from '@/utils/useTextInput.ts';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import {
  onBeforeUnmount,
  onMounted
} from 'vue';

const props = defineProps<{
  regex: RegExp,
  initialName: string,
  loading: boolean,
}>()

const store = useGeneralStore()

const {
  content: nameContent,
  visiblyInvalid: nameVisiblyInvalid,
  valid: nameValid,
  setVisibility: nameSetVisibility
} = useTextInput(  'NotEmpty', props.regex, 1, 8)

function onEnter(e: KeyboardEvent) {
  if(e.key === 'Enter' && nameValid.value) {
    emits('rename', nameContent.value)
  }
}

function resetName() {
  if (props.initialName) {
    nameContent.value = props.initialName
  }
}

onMounted(() => {
  resetName()

  window.addEventListener('keyup', onEnter);
})

onBeforeUnmount(() => {
  window.removeEventListener('keyup', onEnter);
})

const emits = defineEmits<{
  (event: 'rename', name: string): void,
}>()
</script>

<template>
  <Dialog
    v-model:visible="store.renameSTHModalVisible"
    modal
    header="Rename STH Device"
    :style="{ width: '25rem' }"
    :dismissable-mask="true"
    @show="resetName()"
  >
    <span class="text-surface-500 dark:text-surface-400 block">
      To be compliant with the specification, the name must be at most 8 characters.
    </span>
    <div class="flex items-center justify-center my-6">
      <label
        for="name"
        class="font-semibold w-24">Name</label>
      <InputText
        id="name"
        v-model="nameContent"
        :invalid="nameVisiblyInvalid"
        class="flex-auto my-4 "
        autocomplete="off"
        @click.once="nameSetVisibility(true)"
      />
    </div>
    <div class="flex justify-end gap-4">
      <Button
        type="button"
        label="Cancel"
        severity="secondary"
        @click="store.renameSTHModalVisible = false" />
      <Button
        type="button"
        label="Rename"
        :disabled="!nameValid"
        :icon="nameValid ? 'pi pi-check' : ''"
        class="ml-auto"
        :loading="props.loading"
        @click="emits('rename', nameContent)"
        />
    </div>
  </Dialog>
</template>