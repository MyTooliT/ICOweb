<script setup lang="ts">

import DefaultLayout from '@base/layout/DefaultLayout.vue';
import PostMetaData from '@/components/forms/PostMetaData.vue';

</script>

<template>
  <DefaultLayout>
    <PostMetaData :loading="false" />
  </DefaultLayout>
</template>