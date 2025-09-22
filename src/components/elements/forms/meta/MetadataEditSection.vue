<script setup lang="ts">
import {Button, Card, ButtonGroup} from 'primevue';

defineProps<{
  editBtnLabel?: string
  infoText?: string
  state: 'edit'|'view'
  loading?: boolean
}>()

defineEmits<{
  edit: [void],
  cancelEdit: [void],
  save: [void]
}>()
</script>

<template>
  <Card class="border border-amber-500">
    <template #content>
      <div class="flex flex-row gap-3 items-center">
        <slot name="buttons">
          <Button
            v-if="state === 'view'"
            :label="editBtnLabel"
            severity="primary"
            class="shrink-0 grow h-fit my-auto"
            @click="$emit('edit')"
          />
          <div
            v-else
            class="flex flex-row shrink-0"
          >
            <ButtonGroup>
              <Button
                label="Cancel Edit"
                severity="danger"
                @click="$emit('cancelEdit')"
              />
              <Button
                label="Save Metadata"
                severity="primary"
                :loading="loading"
                @click="$emit('save')"
              />
            </ButtonGroup>
          </div>
        </slot>
        <i
          class="pi pi-info-circle text-amber-500"
          style="font-size: 2em;" />
        <p> {{ infoText }} </p>
      </div>
    </template>
  </Card>
</template>