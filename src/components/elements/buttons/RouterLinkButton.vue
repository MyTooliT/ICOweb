<script setup lang="ts">
import {
  RouteLocationRaw,
  useRoute,
  useRouter
} from 'vue-router';

const props = defineProps<{
  to: RouteLocationRaw;
  name: string;
}>()
const router = useRouter()
const route = useRoute()
</script>

<template>
  <button
    :data-active="route.path === props.to"
    class="
      p-3 flex flex-col justify-center items-center
      aspect-square transition-all duration-100
      hover:bg-surface-variant
      data-[active=true]:bg-surface data-[active=true]:text-primary"
    @click="router.push(props.to)">
    <slot>
      {{ props.name }}
    </slot>
  </button>
</template>

<style scoped>

</style>