<script setup lang="ts">
import ToolHolderCard from '@/components/elements/cards/ToolHolderCard.vue';
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import AddHolderModal from '@/components/elements/modals/AddHolderModal.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';

const hw = useHardwareStore()
const gs = useGeneralStore()
</script>

<template>
  <DefaultLayout>
    <TextBlock
      heading="Tool Holder Configuration Table"
      subheading="
        Define and edit usable tool holder templates
        and their sensor configurations"
      @button-click="gs.addHolderModalVisible = true"
    />
    <div class="flex flex-wrap gap-3">
      <ToolHolderCard
        v-for="holder in hw.holderList"
        :key="holder.id"
        :holder="holder"
        :editable="true"
        :deletable="true"
        @remove-holder="hw.removeHolderById(holder.id)"
        @remove-sensor="e => hw.removeSensorFromHolder(holder.id, e)"
        @add-sensor="hw.addSensorToHolder(holder.id)"
      />
      <ToolHolderCard
        :holder="hw.getExposedSensorsAsHolderConfig"
        :editable="false"
        :deletable="false"
      />
    </div>
    <AddHolderModal />
  </DefaultLayout>
</template>

<style scoped>

</style>