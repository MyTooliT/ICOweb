<script setup lang="ts">
import Dialog from 'primevue/dialog';
import PostMetaData from '@/components/forms/PostMetaData.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';

const gStore = useGeneralStore();
const emits = defineEmits(['send'])
defineProps<{
  closable: boolean,
  loading: boolean,
}>()
</script>

<template>
  <Dialog
    v-model:visible="gStore.postMetaModalVisible"
    modal
    :closable="closable"
    :append-to="'body'"
    :block-scroll="true"
    header="Post-Measurement Metadata"
    class="[width:80vw]"
    @after-hide="emits('send')">
    <PostMetaData
      :loading="loading"
      @send="emits('send')"
    />
  </Dialog>
</template>
