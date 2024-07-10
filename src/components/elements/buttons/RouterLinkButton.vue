<script setup lang="ts">
import { RouteLocationRaw, useRoute, useRouter } from 'vue-router';

const props = defineProps<{
  to: RouteLocationRaw;
  name: string;
}>()
const router = useRouter()
const route = useRoute()
</script>

<template>
  <button
    :data-active="route.fullPath === props.to"
    class="
      p-3 aspect-square transition-all duration-100
      hover:bg-surface-variant
      data-[active=true]:bg-surface"
    @click="router.push(props.to)">
    <slot>
      {{ props.name }}
    </slot>
  </button>
</template>

<style scoped>

</style>