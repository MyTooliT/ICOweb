<script setup lang="ts">
import { onMounted, ref } from 'vue'
import RouterLinkButton from '@/components/buttons/RouterLinkButton.vue';

const hasExtraLogo = ref<boolean>(false);

onMounted(async () => {
  hasExtraLogo.value = import.meta.env.VITE_APPLICATION_THEME_EXTRALOGO === 'true'
})
</script>

<template>
  <div class="mt-auto">
    <RouterLinkButton
      v-if="hasExtraLogo"
      name="Help"
      to="/help"
    >
      <img
        src="@/theme/extra.png"
        alt="Extra Logo for ICOweb client"
        class="w-full max-w-16 mx-auto"
      >
    </RouterLinkButton>
    <RouterLinkButton
      name="Help"
      to="/help"
    >
      <img
        src="@/theme/logo.png"
        alt="Logo"
        class="w-full max-w-16 mx-auto"
      >
    </RouterLinkButton>
  </div>
</template>
