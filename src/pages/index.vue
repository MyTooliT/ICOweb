<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import Heading3 from '@/components/typography/heading/Heading3.vue';
import OutlineButton from '@/components/elements/buttons/OutlineButton.vue';
import STHDeviceTable from '@/components/elements/tables/STHDeviceTable.vue';

/* eslint-disable max-len */

/* eslint-enable max-len*/

</script>

<template>
  <DefaultLayout>
    <div class="flex flex-row justify-between">
      <Heading3>Sensory Tool Holders</Heading3>
      <OutlineButton>Reload</OutlineButton>
    </div>
    <Suspense>
      <STHDeviceTable />
    </Suspense>
  </DefaultLayout>
</template>

<style scoped>

</style>