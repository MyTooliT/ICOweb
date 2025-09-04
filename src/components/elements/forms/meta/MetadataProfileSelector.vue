<script setup lang="ts">
import NamedInput from '@/components/elements/forms/NamedInput.vue';
import Select from 'primevue/select';
import { MetadataConfig } from '@/utils/metadataConfig.ts';

defineProps<{
  disabled: boolean,
  config: MetadataConfig
}>()

const selectedProfileKey = defineModel<string>()
</script>

<template>
  <NamedInput title="Profile">
    <template #header>
      <h4 class="font-semibold">
        Metadata Profile
      </h4>
    </template>
    <Select
      v-model="selectedProfileKey"
      :disabled="disabled"
      :options="Object.values(config.profiles)"
      option-label="name"
      option-value="id"
    />
  </NamedInput>
</template>
