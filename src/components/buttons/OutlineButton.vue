<script lang="ts" setup>
/* eslint-disable max-len */
import { ButtonProps } from './types';

withDefaults(defineProps<ButtonProps>(), {
  color: 'primary',
});
</script>

<template>
  <button
    :data-color="color"
    class="
      data-primary:text-primary data-primary:border-primary
      data-primary:hover:bg-primary-container data-primary:hover:text-on-primary-container
      data-primary:disabled:text-gray-400 data-primary:disabled:border-gray-400
      data-primary:disabled:hover:bg-surface

      data-secondary:text-secondary data-secondary:border-secondary
      data-secondary:hover:bg-secondary-container data-secondary:hover:text-on-secondary-container
      data-secondary:disabled:text-gray-400 data-secondary:disabled:border-gray-400
      data-secondary:disabled:hover:bg-surface

      data-tertiary:text-tertiary data-tertiary:border-tertiary
      data-tertiary:hover:bg-tertiary-container data-tertiary:hover:text-on-tertiary-container
      data-tertiary:disabled:text-gray-400 data-tertiary:disabled:border-gray-400
      data-tertiary:disabled:hover:bg-surface

      data-error:text-error data-error:border-error
      data-error:hover:bg-error-container data-error:hover:text-on-error-container
      data-error:disabled:text-gray-400 data-error:disabled:border-gray-400
      data-error:disabled:hover:bg-surface

      bg-surface border-2 px-4 py-2 transition-all"
  >
    <slot name="left" />

    <slot>{{ text }}</slot>

    <slot name="right" />
  </button>
</template>
