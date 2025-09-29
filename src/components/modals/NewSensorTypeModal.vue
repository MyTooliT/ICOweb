<script setup lang="ts">
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useTextInput } from '@/utils/useTextInput.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { onMounted } from 'vue';

const generalStore = useGeneralStore()
const hardwareStore = useHardwareStore()

const {
  content: typeContent,
  valid: typeValid,
  invalid: typeInvalid,
  visiblyInvalid: typeVisiblyInvalid,
  setVisibility: typeSetVisibility,
} = useTextInput('NotEmpty')

const {
  content: unitContent,
  valid: unitValid,
  invalid: unitInvalid,
  visiblyInvalid: unitVisiblyInvalid,
  setVisibility: unitSetVisibility,
} = useTextInput('NotEmpty')

function handleNewType(type: string, unit: string) {
  hardwareStore.addSensorDimension(type, unit)
  generalStore.newTypeModalVisible = false
}

onMounted(() => {
  window.addEventListener('keyup', (e) => {
    if(e.key === 'Enter' && typeValid.value && unitValid.value) {
      handleNewType(typeContent.value, unitContent.value)
    }
  })
})
</script>

<template>
  <Dialog
    v-model:visible="generalStore.newTypeModalVisible"
    modal
    header="Add Sensor type"
  >
    <div class="flex flex-row gap-2 mb-2">
      <div class="flex flex-col items-start gap-2 mb-3">
        <label
          for="type"
          class="font-semibold">Sensor Type</label>
        <InputText
          id="type"
          v-model="typeContent"
          :invalid="typeVisiblyInvalid"
          autocomplete="off"
          @click.once="typeSetVisibility(true)"
        />
      </div>
      <div class="flex flex-col items-start gap-2 mb-3">
        <label
          for="unit"
          class="font-semibold">Unit</label>
        <InputText
          id="unit"
          v-model="unitContent"
          :invalid="unitVisiblyInvalid"
          class="w-24"
          autocomplete="off"
          @click.once="unitSetVisibility(true)"
        />
      </div>
    </div>
    <div class="flex justify-end gap-2">
      <Button
        type="button"
        label="Cancel"
        severity="secondary"
        @click="generalStore.newTypeModalVisible = false" />
      <Button
        type="button"
        label="Add"
        :icon="!typeInvalid && !unitInvalid ? 'pi pi-check' : ''"
        class="ml-auto"
        :disabled="typeInvalid || unitInvalid"
        @click="handleNewType(typeContent, unitContent)" />
    </div>
  </Dialog>
</template>

<style scoped>

</style>