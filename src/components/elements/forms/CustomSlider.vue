<script setup lang="ts">
import Slider from 'primevue/slider';

defineProps<{
  min: number,
  max: number
}>()

const model = defineModel<number>()

const emits = defineEmits<{
  (event: 'slider-change'): void
}>()
</script>

<template>
  <div class="flex">
    <div
      class="
        flex items-center bg-white
        rounded-md border-surface-200 border
      ">
      <span
        class="
          py-2 w-12 text-center
          border-r border-surface-200
        "
      >
        {{ model }}
      </span>
      <Slider
        v-model="model"
        :min="min"
        :max="max"
        class="w-48 px-3 mx-3 rounded-l-md border-gray-200"
        @change="emits('slider-change')"
      />
    </div>
  </div>
</template>

<style scoped>

</style>