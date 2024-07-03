<script lang="ts" setup>
import { ButtonProps } from './types';

const props = withDefaults(defineProps<ButtonProps>(), {
  color: 'primary',
});
</script>

<template>
  <button
    :data-color="color"
    class="data-[color=error]:btn-error data-[color=primary]:btn-primary data-[color=secondary]:btn-secondary data-[color=tertiary]:btn-tertiary border-0 px-4 py-2 transition-all hover:border-0 hover:shadow-xl disabled:hover:shadow-none">
    <slot name="left" />

    <slot>{{ text }}</slot>

    <slot name="right" />
  </button>
</template>
