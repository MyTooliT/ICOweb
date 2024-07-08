<script lang="ts" setup>
import { ButtonProps } from './types';

withDefaults(defineProps<ButtonProps>(), {
  color: 'primary',
});
</script>

<template>
  <!-- eslint-disable max-len  -->
  <button
    :data-color="color"
    class="
      data-primary:bg-primary data-primary:text-on-primary data-primary:shadow-primary
      data-primary:disabled:bg-primary-fixed-dim data-primary:disabled:hover:bg-primary-fixed-dim

      data-secondary:bg-secondary data-secondary:text-on-secondary data-secondary:shadow-secondary
      data-secondary:disabled:bg-secondary-fixed-dim data-secondary:disabled:hover:bg-secondary-fixed-dim

      data-tertiary:bg-tertiary data-tertiary:text-on-tertiary data-tertiary:shadow-tertiary
      data-tertiary:disabled:bg-tertiary-fixed-dim data-tertiary:disabled:hover:bg-tertiary-fixed-dim

      data-error:bg-error data-error:text-on-error data-error:shadow-error
      data-error:disabled:bg-error-container data-error:disabled:text-secondary data-error:disabled:hover:bg-error-container

      border-0 px-4 py-2 transition-all
      hover:border-0 hover:shadow-xl disabled:hover:shadow-none">
    <slot name="left" />

    <slot>{{ text }}</slot>

    <slot name="right" />
  </button>
</template>
