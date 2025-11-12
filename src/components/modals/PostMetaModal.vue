<script setup lang="ts">
import Dialog from 'primevue/dialog';
import PostMetaData from '@/components/forms/PostMetaData.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';

const gStore = useGeneralStore();
const emits = defineEmits(['send', 'canceled'])
defineProps<{
  loading: boolean,
}>()
</script>

<template>
  <Dialog
    v-model:visible="gStore.postMetaModalVisible"
    modal
    :closable="false"
    :append-to="'body'"
    :block-scroll="true"
    header="Post-Measurement Metadata"
    class="[width:80vw]">
    <PostMetaData
      :loading="loading"
      @send="emits('send')"
      @canceled="emits('canceled')"
    />
  </Dialog>
</template>
