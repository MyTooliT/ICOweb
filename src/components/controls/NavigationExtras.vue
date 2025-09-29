<script setup lang="ts">
import logo from '@/assets/img/ift_logo.jpg';
import {ref} from 'vue'
import RouterLinkButton from '@/components/buttons/RouterLinkButton.vue';

const extraLogo = ref<string|undefined>(import.meta.env.VITE_APPLICATION_EXTRA_LOGO);
const alt = ref<string|undefined>(import.meta.env.VITE_APPLICATION_EXTRA_LOGO_ALT);
</script>

<template>
  <div class="mt-auto">
    <RouterLinkButton
      v-if="extraLogo"
      name="Help"
      to="/help"
    >
      <img
        :src="`./extra/${extraLogo}`"
        :alt="alt"
        class="w-full max-w-16 mx-auto"
      >
    </RouterLinkButton>
    <RouterLinkButton
      name="Help"
      to="/help"
    >
      <img
        :src="logo"
        alt="IFT Logo"
        class="w-full max-w-16 mx-auto"
      >
    </RouterLinkButton>
  </div>
</template>
