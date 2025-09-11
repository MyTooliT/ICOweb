<script setup lang="ts">
import MetaInputProvider from '@/components/elements/forms/meta/MetaInputProvider.vue';
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
  <form>
    <div
      v-for="[category, categoryParameters] in Object.entries(phase)"
      :key="category"
      class="mt-4 pt-3 border-t "
    >
      <h4 class="font-semibold">
        {{ category }}
      </h4>
      <div class="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(30ch,1fr))]">
        <div
          v-for="([param_key, param_definition]) in Object.entries(categoryParameters)"
          :key="param_key"
        >
          <MetaInputProvider
            :model-value="stateObject[param_key]"
            phase="pre"
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
