<script setup lang="ts">
import {
  RouteLocationRaw,
  useRoute,
  useRouter
} from 'vue-router';

const props = defineProps<{
  to: RouteLocationRaw;
  name: string;
  disabled?: boolean;
}>()
const router = useRouter()
const route = useRoute()
</script>

<template>
  <button
    :data-active="route.matched.map(match => match.name).includes(props.name)"
    :data-disabled="disabled"
    :disabled="disabled"
    class="
      p-3 flex flex-col justify-center items-center
      aspect-square transition-all duration-100
      hover:bg-surface-variant
      data-[disabled=true]:hover:bg-inherit data-[disabled=true]:cursor-not-allowed
      data-[active=true]:bg-surface data-[active=true]:text-primary"
    @click="router.push(props.to)">
    <slot>
      {{ props.name }}
    </slot>
  </button>
</template>

<style scoped>

</style>