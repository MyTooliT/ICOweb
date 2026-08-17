<script setup lang="ts">
import {Button, Card, ButtonGroup} from 'primevue';

defineProps<{
  editBtnLabel?: string
  addBtnLabel?: string
  infoText?: string
  state: 'edit'|'view'|'empty'
  loading?: boolean
  deleteLoading?: boolean
}>()

defineEmits<{
  edit: [void],
  add: [void],
  cancelEdit: [void],
  save: [void],
  delete: [void]
}>()
</script>

<template>
  <Card class="border border-amber-500">
    <template #content>
      <div class="flex flex-row gap-3 items-center">
        <slot name="buttons">
          <Button
            v-if="state === 'empty'"
            :label="addBtnLabel"
            severity="primary"
            class="shrink-0 h-fit my-auto"
            @click="$emit('add')"
          />
          <div
            v-else-if="state === 'view'"
            class="flex flex-row shrink-0 gap-2"
          >
            <Button
              :label="editBtnLabel"
              severity="primary"
              @click="$emit('edit')"
            />
            <Button
              label="Delete"
              severity="danger"
              variant="outlined"
              :loading="deleteLoading"
              @click="$emit('delete')"
            />
          </div>
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