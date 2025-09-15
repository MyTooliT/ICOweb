<script setup lang="ts">
import {ref} from 'vue';
import AutoComplete from 'primevue/autocomplete';

const model = defineModel<string|undefined>()
const props = defineProps<{
  options: readonly string[],
}>()

const suggestions = ref<Array<string>>([])
const search = (event: any) => {
  const entry = String(event.query).toLowerCase()
  if (entry.length === 0) {
    suggestions.value = [...props.options]
  } else {
    suggestions.value = props.options.filter(opt => String(opt).toLowerCase().includes(String(event.query).toLowerCase())) ?? [];
  }
}
</script>

<template>
  <AutoComplete
    v-model="model"
    :suggestions="suggestions"
    input-class="w-full"
    @complete="search"
  />
</template>