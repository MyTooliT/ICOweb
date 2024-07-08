<script lang="ts" setup>
import SolidButton from './buttons/SolidButton.vue';
import OutlineButton from './buttons/OutlineButton.vue';
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
  <div class="mb-3 rounded-lg border border-primary p-3 text-left">
    <OutlineButton
      color="primary"
      text="primary" />
    <OutlineButton
      color="secondary"
      text="secondary" />
    <OutlineButton
      color="tertiary"
      text="tertiary" />
    <OutlineButton
      color="error"
      text="error" />
    <OutlineButton
      color="primary"
      text="primary"
      disabled />
    <OutlineButton
      color="secondary"
      text="secondary"
      disabled />
    <OutlineButton
      color="tertiary"
      text="tertiary"
      disabled />
    <OutlineButton
      color="error"
      text="error"
      disabled />
  </div>
</template>
