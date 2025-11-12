<script setup lang="ts">
import { getAPILink } from '@/api/icoapi.ts';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import FileUpload from 'primevue/fileupload';
import ProgressBar from 'primevue/progressbar';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const store = useGeneralStore();
const router = useRouter();

const emits = defineEmits<{
  (event: 'upload', data: string): void,
}>()

const showUploadProgress = ref(false)
const uploadProgress = ref(0)
</script>

<template>
  <Dialog
    v-model:visible="store.fileSelectionModalVisible"
    :closable="false"
    :dismissable-mask="true">
    <template #header>
      <h2 class="text-xl text-center w-full border-b pb-3">
        Where is your file?
      </h2>
    </template>
    <div class="flex gap-5">
      <div class="flex-col flex-auto basis-0">
        <p class="text-center">
          Captured on this device
        </p>
        <Button
          label="Select Measurement"
          icon="pi pi-folder"
          class="w-full my-10"
          @click="router.push('/files')"
        />
        <p class="text-center">
          Choose from acquired measurements
        </p>
      </div>
      <div class="flex-auto basis-0">
        <p class="text-center">
          Select from external source
        </p>
        <FileUpload
          class="my-10 w-full"
          name="file"
          mode="basic"
          choose-label="External File"
          :url="`${getAPILink()}/files/analyze`"
          :multiple="false"
          auto
          @before-upload="showUploadProgress = true"
          @progress="(event) => uploadProgress = event.progress"
          @upload="(event) => {
            emits('upload', event.xhr.response as string)
            uploadProgress = 0
            showUploadProgress = false
          }"
          @error="console.error($event)" />
        <ProgressBar
          v-if="showUploadProgress"
          :value="uploadProgress"
          :pt="{
            value: {
              style: ['transition: none;']
            }
          }"
        />
        <p class="text-center">
          Upload from your computer
        </p>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>

</style>