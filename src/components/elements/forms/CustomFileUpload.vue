<script setup lang="ts">
import { ref } from 'vue';
import FileUpload from 'primevue/fileupload';

interface Base64Map {
  [filename: string]: string;
}

defineProps<{
  required: boolean,
}>()

const emits = defineEmits<{
  images: [Base64Map],
}>()
const base64Images = ref<Base64Map>({});

function onFileSelect(event: { files: File[] }) {
  const files = event.files;

  files.forEach(file => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      base64Images.value[file.name] = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

  emits('images', base64Images.value)
}
</script>

<template>
  <div class="card flex flex-col items-center gap-6">
    <FileUpload
      mode="basic"
      custom-upload
      auto
      multiple
      accept="image/*"
      :choose-button-props="{ severity: (required && Object.keys(base64Images).length === 0 ) ? 'danger' : 'primary' }"
      class="p-button-outlined"
      @select="onFileSelect"
    />

    <div
      v-if="Object.keys(base64Images).length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full"
    >
      <div
        v-for="(src, name) in base64Images"
        :key="name"
        class="flex flex-col items-center"
      >
        <img
          :src="src"
          :alt="name ?? ''"
          class="shadow-md w-full sm:w-64"
        >
        <span class="mt-2 text-sm text-gray-600">{{ name }}</span>
      </div>
    </div>
  </div>
</template>
