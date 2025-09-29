<script setup lang="ts">
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { useTextInput } from '@/utils/useTextInput.ts';
import {
  computed,
  onMounted
} from 'vue';

const generalStore = useGeneralStore()
const hwStore = useHardwareStore()

const {
  content: nameContent,
  visiblyInvalid: nameVisiblyInvalid,
  valid: nameValid,
  setVisibility: nameSetVisibility
} = useTextInput(  'NotEmpty', null, 1, 80)
const {
  content: idContent,
  visiblyInvalid: idVisiblyInvalid,
  valid: idValid,
  setVisibility: idSetVisibility
} = useTextInput(  'NotEmpty', null, 1, 80)

const valid = computed<boolean>(() => {
  return (
    nameValid.value &&
    idValid.value &&
    hwStore.holderIDIsViable(idContent.value))
})

function handleSubmit() {
  hwStore.addHolder(idContent.value, nameContent.value)
  generalStore.addHolderModalVisible = false
}

onMounted(() => {
  window.addEventListener('keyup', (e) => {
    if(e.key === 'Enter' && valid.value) {
      handleSubmit()
    }
  })
})
</script>

<template>
  <Dialog
    v-model:visible="generalStore.addHolderModalVisible"
    modal
    header="Add Holder Template"
    :style="{ width: '25rem' }">
    <span class="text-surface-500 dark:text-surface-400 block mb-8">
      Provide a template name and a unique ID.
    </span>
    <div class="flex items-center gap-4 mb-4">
      <label
        for="name"
        class="font-semibold w-24">Name</label>
      <InputText
        id="name"
        v-model="nameContent"
        :invalid="nameVisiblyInvalid"
        class="flex-auto"
        autocomplete="off"
        @click.once="nameSetVisibility(true)"
      />
    </div>
    <div class="flex items-center gap-4 mb-8">
      <label
        for="holder_id"
        class="font-semibold w-24">Unique ID</label>
      <InputText
        id="holder_id"
        v-model="idContent"
        :invalid="idVisiblyInvalid || !hwStore.holderIDIsViable(idContent)"
        class="flex-auto"
        autocomplete="off"
        @click.once="idSetVisibility(true)"
      />
    </div>
    <div class="flex justify-end gap-2">
      <Button
        type="button"
        label="Cancel"
        severity="secondary"
        @click="generalStore.addHolderModalVisible = false" />
      <Button
        type="button"
        label="Add"
        :disabled="!valid"
        :icon="valid ? 'pi pi-check' : ''"
        class="ml-auto"
        @click="handleSubmit" />
    </div>
  </Dialog>
</template>

<style scoped>

</style>