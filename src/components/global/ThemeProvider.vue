<script lang="ts" setup>
enum ThemeStyle {
  Dark = 'dark',
  DarkMediumContrast = 'dark-mc',
  DarkHighContrast = 'dark-hc',
  Light = 'light',
  LightMediumContrast = 'light-mc',
  LightHighContrast = 'light-hc',
}
</script>

<template>
  <div>
    <slot />
  </div>
</template>
