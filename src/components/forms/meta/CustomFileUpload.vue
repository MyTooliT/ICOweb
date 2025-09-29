<script setup lang="ts">
import FileUpload from 'primevue/fileupload';

export type Base64Map = {
  [filename: string]: string;
}

defineProps<{
  required: boolean,
  disabled?: boolean
  modelValue?: Base64Map,
}>()

const emits = defineEmits<{
  'update:modelValue': [Base64Map],
}>()

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

async function onFileSelect(event: { files: File[] }) {
  const imageFiles = event.files.filter(f => f.type.startsWith('image/'));

  const entries = await Promise.all(
      imageFiles.map(async (file) => {
        const dataUrl = await readAsDataURL(file);
        return [file.name, dataUrl] as const;
      })
  );

  const base64Images: Base64Map = Object.fromEntries(entries);

  emits('update:modelValue', base64Images);
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
      :choose-button-props="{ severity: (required && Object.keys(modelValue?? {}).length === 0 ) ? 'danger' : 'primary' }"
      :disabled="disabled"
      class="p-button-outlined"
      @select="onFileSelect"
    />
    <div
      v-if="modelValue"
      class="flex [flex-basis:100%] flex-grow"
    >
      <div
        v-for="[key, src] in Object.entries(modelValue?? {})"
        :key="key"
        class="flex flex-col items-center"
      >
        <img
          :src="src"
          :alt="key"
          class="shadow-md w-full sm:w-64"
        >
        <span class="mt-2 text-sm text-gray-600">{{ key }}</span>
      </div>
    </div>
  </div>
</template>
