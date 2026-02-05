<script setup lang="ts">

import DefaultLayout from '@/ICOClientBase/layout/DefaultLayout.vue';
import PostMetaData from '@/components/forms/PostMetaData.vue';

</script>

<template>
  <DefaultLayout>
    <PostMetaData :loading="false" />
  </DefaultLayout>
</template>