<script setup lang="ts">
defineProps<{
  annotation: string,
  content: string
}>()
</script>

<template>
  <div>
    <div class="text-sm">
      {{ annotation }}
    </div>
    <div class="text-lg font-semibold">
      {{ content }}
    </div>
  </div>
</template>
