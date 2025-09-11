<script setup lang="ts">
import {ref, watch} from 'vue';
import FileUpload from 'primevue/fileupload';

export interface Base64Map {
  [filename: string]: string;
}

const props = defineProps<{
  required: boolean,
  modelValue?: Base64Map,
}>()

const emits = defineEmits<{
  'update:modelValue': [Base64Map],
}>()
const base64Images = ref<Base64Map>({});

function onFileSelect(event: { files: File[] }) {
  const files = event.files;
  base64Images.value = {};

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

  emits('update:modelValue', base64Images.value)
}

watch(props, (newVal) => {
  if(newVal.modelValue) {
    base64Images.value = newVal.modelValue;
    emits('update:modelValue', newVal.modelValue)
  }
}, {
  immediate: true,
  deep: true,
})
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
      class="flex [flex-basis:100%] flex-grow"
    >
      <div
        v-for="[key, src] in Object.entries(base64Images)"
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
