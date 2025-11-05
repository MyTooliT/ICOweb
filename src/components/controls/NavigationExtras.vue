<script setup lang="ts">
import { onMounted, ref } from 'vue'
import RouterLinkButton from '@/components/buttons/RouterLinkButton.vue';

const hasExtraLogo = ref<boolean>(false);
const fetchExtraLogo = async () => {
  try {
    const res = await fetch('./logo/extra.png')
    return !!res.headers.get('content-type')?.includes('image');
  }
  catch(e) {
    return false
  }
}

onMounted(async () => {
  hasExtraLogo.value = await fetchExtraLogo()
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
        src="/logo/extra.png"
        alt="Extra Logo for ICOweb client"
        class="w-full max-w-16 mx-auto"
      >
    </RouterLinkButton>
    <RouterLinkButton
      name="Help"
      to="/help"
    >
      <img
        src="/logo/logo.png"
        alt="Logo"
        class="w-full max-w-16 mx-auto"
      >
    </RouterLinkButton>
  </div>
</template>
