<script setup lang="ts">
import Slider from 'primevue/slider';

defineProps<{
  min: number,
  max: number,
  title?: string
}>()

const model = defineModel<number>()

const emits = defineEmits<{
  (event: 'slider-change'): void
}>()
</script>

<template>
  <div class="flex">
    <div
      v-if="title"
      class="
        flex items-center bg-white w-36 px-3 py-2 box-content
        rounded-l-md border-surface-300 border">
      {{ title }}
    </div>
    <div
      class="
        flex items-center bg-white box-content
        border-surface-300 border border-l-0
      "
      :class="title?.length ? 'rounded-r-md' : 'rounded-md'"
    >
      <span
        class="
          py-2 w-12 text-center
          border-r border-surface-300
        "
      >
        {{ model }}
      </span>
      <Slider
        v-model="model"
        fluid
        :min="min"
        :max="max"
        class="min-w-48 px-3 mx-3 rounded-l-md border-gray-200"
        @change="emits('slider-change')"
      />
    </div>
  </div>
</template>

<style scoped>

</style>