<script lang="ts" setup>
import SolidButton from './buttons/SolidButton.vue';
</script>

<template>
  <div class="mb-3 rounded-lg border border-primary p-3 text-left">
    <SolidButton
      color="primary"
      text="primary" />
    <SolidButton
      color="secondary"
      text="secondary" />
    <SolidButton
      color="tertiary"
      text="tertiary" />
    <SolidButton
      color="error"
      text="error" />
    <SolidButton
      color="primary"
      text="primary"
      disabled />
    <SolidButton
      color="secondary"
      text="secondary"
      disabled />
    <SolidButton
      color="tertiary"
      text="tertiary"
      disabled />
    <SolidButton
      color="error"
      text="error"
      disabled />
  </div>
</template>
