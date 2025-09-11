<script setup lang="ts">
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import NamedInput from '@/components/elements/forms/NamedInput.vue';
import {computed} from 'vue';
import CustomFileUpload from '@/components/elements/forms/CustomFileUpload.vue';
import {AnyMetadataParameterDefinition, hasUnit, MetadataPhaseKey} from '@/utils/metadataConfig.ts';
import MetaTextSuggestable from '@/components/elements/forms/meta/MetaTextSuggestable.vue';
import MetaInputIntQty from '@/components/elements/forms/meta/MetaInputIntQty.vue';
import MetaInputFloatQty from '@/components/elements/forms/meta/MetaInputFloatQty.vue';

const props = defineProps<{
  definition: AnyMetadataParameterDefinition;
  disabled?: boolean,
  phase: MetadataPhaseKey
  modelValue: any
}>()

const emits = defineEmits<{
  'update:modelValue': [any]
}>()

const title = computed(() => {
  let needsAsterisk = props.definition.required === 'required' && !['restricted', 'implementation'].includes(props.definition?.type)
  return `${props.definition.label}${hasUnit(props.definition) ? ' in ' + props.definition.unit : ''}${needsAsterisk ? ' *' : ''}`
})

</script>

<template>
  <NamedInput
    v-if="definition"
    :tooltip="definition.description"
    :title="title"
  >
    <MetaTextSuggestable
      v-if="definition.datatype === 'text_suggestions'"
      :options="definition.options"
      :disabled="disabled"
      :model-value="modelValue"
      @update:model-value="e => emits('update:modelValue', e)"
    />
    <InputNumber
      v-else-if="definition.datatype === 'int'"
      :min-fraction-digits="0"
      :max-fraction-digits="0"
      :use-grouping="false"
      :invalid="(definition.required === 'required' || definition.required === 'restricted') && modelValue === undefined"
      :disabled="disabled"
      :model-value="modelValue"
      @update:model-value="e => emits('update:modelValue', e)"
    />
    <InputNumber
      v-else-if="definition.datatype === 'float'"
      :min-fraction-digits="0"
      :max-fraction-digits="4"
      :use-grouping="false"
      :invalid="(definition.required === 'required' || definition.required === 'restricted') && modelValue === undefined"
      :disabled="disabled"
      :model-value="modelValue"
      @update:model-value="e => emits('update:modelValue', e)"
    />
    <MetaInputIntQty
      v-else-if="definition.datatype === 'int_qty'"
      :unit="definition.unit"
      :required="definition.required === 'required' || definition.required === 'restricted'"
      :disabled="disabled"
      :model-value="modelValue"
      @update:model-value="e => emits('update:modelValue', e)"
    />
    <MetaInputFloatQty
      v-else-if="definition.datatype === 'float_qty'"
      :unit="definition.unit"
      :required="definition.required === 'required' || definition.required === 'restricted'"
      :disabled="disabled"
      :model-value="modelValue"
      @update:model-value="e => emits('update:modelValue', e)"
    />
    <Checkbox
      v-else-if="definition.datatype === 'boolean'"
      binary
      :invalid="(definition.required === 'required' || definition.required === 'restricted') && modelValue === undefined"
      :disabled="disabled"
      :model-value="modelValue"
      @update:model-value="e => emits('update:modelValue', e)"
    />
    <Textarea
      v-else-if="definition.datatype === 'text_box'"
      :invalid="(definition.required === 'required' || definition.required === 'restricted') && (modelValue === undefined || modelValue === '')"
      :disabled="disabled"
      :model-value="modelValue"
      @update:model-value="e => emits('update:modelValue', e)"
    />
    <Select
      v-else-if="definition.datatype === 'dropdown'"
      :options="definition.options as any[]"
      :invalid="(definition.required === 'required' || definition.required === 'restricted') && (modelValue === undefined || modelValue === '')"
      :disabled="disabled"
      :model-value="modelValue"
      @update:model-value="e => emits('update:modelValue', e)"
    />
    <InputText
      v-if="definition.datatype === 'text'"
      :invalid="(definition.required === 'required' || definition.required === 'restricted') && (modelValue === undefined || modelValue === '')"
      :disabled="disabled"
      :model-value="modelValue"
      @update:model-value="e => emits('update:modelValue', e)"
    />
    <CustomFileUpload
      v-else-if="definition.datatype === 'image'"
      :required="definition.required === 'required' || definition.required === 'restricted'"
      :disabled="disabled"
      :model-value="modelValue"
      @update:model-value="e => emits('update:modelValue', e)"
    />
  </NamedInput>
</template>