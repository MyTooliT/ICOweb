<script setup lang="ts">
import {Badge, Button, FileUpload, FileUploadErrorEvent, FileUploadUploadEvent} from 'primevue';
import {ref} from 'vue';

defineProps<{
  url: string,
  maxFileSize: number,
  fileLimit: number,
}>()

defineEmits<{
  (event: 'success', data: FileUploadUploadEvent): void,
  (event: 'error', data: FileUploadErrorEvent): void,
}>()

const uploading = ref(false)
</script>

<template>
  <FileUpload
    name="file"
    :preview-width="0"
    choose-label="Select New File"
    :url="url"
    :max-file-size="maxFileSize"
    :file-limit="fileLimit"
    :pt="{
      root: {
        class: '!border-0'
      },
      header: {
        class: '!p-3'
      },
      content: {
        class: '!border !rounded-md !border-gray-400 !p-3 !mx-3 !border-dashed'
      }
    }"
    class="border-0"
    @before-upload="uploading = true"
    @error="e => {
      uploading = false;
      $emit('error', e)
    }"
    @upload="e => {
      uploading = false
      $emit('success', e)
    }">
    <template #header="{ uploadCallback, chooseCallback, files, uploadedFiles }">
      <div class="flex flex-row gap-3 w-full">
        <Button
          label="Select File"
          icon="pi pi-plus"
          @click="chooseCallback"
        />
        <div
          v-if="uploadedFiles.length < files.length"
          class="flex flex-col justify-center mx-auto">
          <div
            v-for="file in files"
            :key="file.name">
            Selected File: <span class="font-bold">{{ file.name }}</span>
            <Badge
              value="Awaiting Upload"
              severity="warn"
              class="ml-1" />
          </div>
        </div>
        <div
          v-else
          class="mx-auto flex justify-center items-center">
          <p>
            No file selected.
          </p>
        </div>
        <Button
          label="Upload"
          icon="pi pi-upload"
          :disabled="!files || files.length === 0"
          @click="() => {
            uploadCallback()
            files.length = 0
          }"
        />
      </div>
    </template>
    <template #content="{ messages }">
      <div v-if="messages && messages.length > 0">
        <p
          v-for="message in messages"
          :key="message">
          {{ message }}
        </p>
      </div>
      <p
        v-else
        class="text-center">
        Drag your file here to upload it.
      </p>
    </template>
  </FileUpload>
</template>