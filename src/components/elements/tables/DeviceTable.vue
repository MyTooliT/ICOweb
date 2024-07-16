<script setup lang="ts">

</script>

<template>
  <table class="border-t border-gray-200">
    <thead class="font-bold border-b border-gray-200">
      <slot name="head" />
    </thead>
    <tbody>
      <slot />
    </tbody>
  </table>
</template>

<style scoped>

</style>