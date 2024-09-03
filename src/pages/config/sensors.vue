<script setup lang="ts">
import Button from 'primevue/button';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import SensorTable from '@/components/elements/tables/SensorTable.vue';
</script>

<template>
  <DefaultLayout>
    <div class="flex flex-col">
      <div
        class="flex flex-row justify-between border-b border-gray-200 pb-3 mb-3"
      >
        <div>
          <h2>Global Sensor Table</h2>
          <h6>
            The general sensor table.
            Here you can define what is accessible globally.
          </h6>
        </div>
        <Button
          outlined
          label="Add"
          icon="pi pi-plus"
        />
      </div>
      <SensorTable />
    </div>
  </DefaultLayout>
</template>

<style scoped>

</style>