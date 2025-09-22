<script setup lang="ts">

import DefaultLayout from '@/layouts/DefaultLayout.vue';
import PostMetaData from '@/components/elements/forms/meta/PostMetaData.vue';

</script>

<template>
  <DefaultLayout>
    <PostMetaData :loading="false" />
  </DefaultLayout>
</template>