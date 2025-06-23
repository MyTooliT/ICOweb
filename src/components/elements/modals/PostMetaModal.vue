<script setup lang="ts">
import Dialog from 'primevue/dialog';
import PostMetaData from '@/components/elements/forms/meta/PostMetaData.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';

const gStore = useGeneralStore();
const emits = defineEmits(['send'])
defineProps<{
  closable: boolean,
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
    class="[width:clamp(10rem,75%,60rem)]"
  >
    <PostMetaData
      @send="emits('send')"
    />
  </Dialog>
</template>
