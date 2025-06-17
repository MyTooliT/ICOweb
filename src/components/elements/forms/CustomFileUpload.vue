<script setup lang="ts">
import { ref } from 'vue';
import FileUpload from 'primevue/fileupload';

interface Base64Map {
  [filename: string]: string;
}

const base64Images = ref<Base64Map>({});

function onFileSelect(event: { files: File[] }) {
  const files = event.files;

  files.forEach(file => {
    // Nur Bilder verarbeiten
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      base64Images.value[file.name] = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
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
      severity="secondary"
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
          :alt="name"
          class="shadow-md rounded-xl w-full sm:w-64"
          style="filter: grayscale(100%)"
        >
        <span class="mt-2 text-sm text-gray-600">{{ name }}</span>
      </div>
    </div>
  </div>
</template>
