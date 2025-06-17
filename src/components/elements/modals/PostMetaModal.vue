<script setup lang="ts">
import Dialog from 'primevue/dialog';
import PostMetaData from '@/components/elements/forms/meta/PostMetaData.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';

const gStore = useGeneralStore();
</script>

<template>
  <Dialog
    v-model:visible="gStore.postMetaModalVisible"
    modal
    :closable="true"
    header="Post-Measurement Metadata"
    class="[width:clamp(10rem,75%,60rem)]"
  >
    <PostMetaData />
  </Dialog>
</template>

<style scoped>

</style>