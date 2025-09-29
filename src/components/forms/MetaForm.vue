<script setup lang="ts">
import MetaInputProvider from '@/components/forms/meta/MetaInputProvider.vue';
import {AnyMetadataParameterDefinition, computeValidity, ProfilePhase} from '@/utils/metadataConfig.ts';

defineProps<{
  phase: ProfilePhase,
  disabled?: boolean,
  stateObject: Record<string, any>
  stateValidity: boolean,
}>()

const emits = defineEmits<{
  'update:stateObject': [Record<string, any>],
  'update:stateValidity': [boolean]
}>()

</script>

<template>
  <form class="flex flex-col">
    <div
      v-for="[category, categoryParameters] in Object.entries(phase)"
      :key="category"
      class="border-b mb-4 pb-3 last:border-none last:mb-0 last:pb-0"
    >
      <h4 class="font-semibold">
        {{ category }}
      </h4>
      <div class="flex flex-row flex-wrap">
        <div
          v-for="([param_key, param_definition]) in Object.entries(categoryParameters)"
          :key="param_key"
          class="flex-shrink [flex-basis:25%] p-[.375rem]"
        >
          <MetaInputProvider
            :model-value="stateObject[param_key]"
            :definition="(param_definition as AnyMetadataParameterDefinition)"
            :disabled="(param_definition as AnyMetadataParameterDefinition).type === 'implementation' || (param_definition as AnyMetadataParameterDefinition).required === 'restricted' || disabled"
            @update:model-value="e => {
              const copy = JSON.parse(JSON.stringify(stateObject))
              copy[param_key] = e
              emits('update:stateObject', copy)
              emits('update:stateValidity', computeValidity(copy, phase))
            }"
          />
        </div>
      </div>
    </div>
  </form>
</template>
