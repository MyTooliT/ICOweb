<script setup lang="ts">
import ToolHolderCard from '@/components/elements/cards/ToolHolderCard.vue';
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import AddHolderModal from '@/components/elements/modals/AddHolderModal.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import Button from 'primevue/button';

const hw = useHardwareStore()
const gs = useGeneralStore()
</script>

<template>
  <DefaultLayout>
    <TextBlock
      heading="Custom Tool Holder"
      subheading="
      Define and edit custom tool holder templates
      and their sensor configurations for your applications."
      @button-click="gs.addHolderModalVisible = true"
    />
    <div class="flex flex-wrap gap-3 mb-4">
      <template v-if="hw.holderList.length > 0">
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
      </template>
      <div
        v-else
        class="text-center h-stretch flex justify-center w-full"
      >
        <div class="flex flex-col gap-4 w-fit my-6">
          <h2 class="text-lg">
            No custom tool holders are set up.
          </h2>
          <Button
            label="Add a Configuration"
            severity="primary"
            outlined
            @click="gs.addHolderModalVisible = true"
          />
        </div>
      </div>
    </div>
    <TextBlock
      heading="Default Tool Holder"
      subheading="
        These configurations are standard for the IFT / MyTooliT Sensory Tool Holder packages and cannot be changed. They persist cache-clearings."
      :button="false"
    />
    <div class="flex flex-wrap gap-3">
      <ToolHolderCard
        v-for="holder in [...hw.defaultHolderList, hw.getExposedSensorsAsHolderConfig]"
        :key="holder.id"
        :holder="holder"
        :editable="false"
        :deletable="false"
      />
    </div>
    <AddHolderModal />
  </DefaultLayout>
</template>

<style scoped>

</style>