<script setup lang="ts">
import { getAPILink } from '@/api/api.ts';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import FileUpload from 'primevue/fileupload';
import { defineEmits } from 'vue';
import { useRouter } from 'vue-router';

const store = useGeneralStore();
const router = useRouter();

const emits = defineEmits<{
  (event: 'upload', data: string): void,
}>()

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
        <p class="text-center">Select from external source</p>
        <FileUpload
          class="my-10 w-full"
          name="file"
          mode="basic"
          choose-label="External File"
          :url="`${getAPILink()}/files/analyze`"
          :multiple="false"
          auto
          @upload="emits('upload', $event.xhr.response as string)"
          @error="console.error($event)">
        </FileUpload>
        <p class="text-center">Upload from your computer</p>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>

</style>