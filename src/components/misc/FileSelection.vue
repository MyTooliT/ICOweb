<script setup lang="ts">
import { getAPILink } from '@/api/icoapi.ts';
import { useMessageBus } from '@/message';
import Button from 'primevue/button';
import FileUpload, { FileUploadErrorEvent } from 'primevue/fileupload';
import ProgressBar from 'primevue/progressbar';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

/**
 * Choose the measurement to analyze: one of the measurement files on the
 * server (via the Files page) or an external HDF5 file, which is uploaded to
 * the API first. Emits the name of the uploaded file.
 */
const emits = defineEmits<{
  (event: 'upload', name: string): void
}>()

const router = useRouter()
const m = useMessageBus()

const uploading = ref(false)
const uploadProgress = ref(0)

function onUploadError(event: FileUploadErrorEvent) {
  uploading.value = false
  uploadProgress.value = 0
  m.error('Upload failed', event.xhr?.statusText || 'The file could not be uploaded.')
}
</script>

<template>
  <div
    class="grid grid-cols-1 sm:grid-cols-2 text-sm divide-y sm:divide-y-0
      sm:divide-x divide-[var(--p-content-border-color)]"
  >
    <div class="flex flex-col gap-2 pb-3 sm:pb-0 sm:pr-4">
      <div>
        <p class="font-medium">
          Measurement on this device
        </p>
        <p class="text-xs ico-muted">
          Choose one of the recorded measurements on the Files page.
        </p>
      </div>
      <Button
        label="Open Files"
        icon="pi pi-folder"
        size="small"
        outlined
        class="mt-auto"
        @click="router.push('/files')"
      />
    </div>
    <div class="flex flex-col gap-2 pt-3 sm:pt-0 sm:pl-4">
      <div>
        <p class="font-medium">
          External file
        </p>
        <p class="text-xs ico-muted">
          Upload an HDF5 measurement file from your computer.
        </p>
      </div>
      <ProgressBar
        v-if="uploading"
        class="mt-auto !h-2"
        :value="Math.round(uploadProgress)"
        :show-value="false"
        :pt="{
          value: {
            style: ['transition: none;']
          }
        }"
      />
      <FileUpload
        v-else
        class="mt-auto"
        name="file"
        mode="basic"
        choose-label="Upload File"
        choose-icon="pi pi-upload"
        :choose-button-props="{ size: 'small', outlined: true, fluid: true }"
        :url="`${getAPILink()}/files/analyze`"
        :multiple="false"
        auto
        @before-upload="uploading = true"
        @progress="(event) => uploadProgress = event.progress"
        @upload="(event) => {
          uploading = false
          uploadProgress = 0
          emits('upload', event.xhr.response as string)
        }"
        @error="onUploadError"
      />
    </div>
  </div>
</template>
