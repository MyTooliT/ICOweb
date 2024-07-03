<script lang="ts" setup>
import { Dict } from '@/types/types';
import { HeadingVariant } from '@/types/types';

const headingStyles: Dict<HeadingVariant, String> = {
  h1: 'mb-4 text-6xl',
  h2: 'mb-4 text-5xl',
  h3: 'mb-3 text-4xl',
  h4: 'mb-3 text-3xl',
  h5: 'mb-2 text-2xl',
  h6: 'mb-2 text-1xl',
};

defineProps<{
  variant: HeadingVariant;
}>();
</script>

<template>
  <component
    :is="variant"
    :class="headingStyles[variant]">
    <slot />
  </component>
</template>
