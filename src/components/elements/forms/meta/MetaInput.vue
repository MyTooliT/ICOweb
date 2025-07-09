<script setup lang="ts">
import {Parameter, ParameterDefinition, ProfileParamDefinition} from '@/types/metadata';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import {AutoComplete, Textarea} from 'primevue';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import NamedInput from '@/components/elements/forms/NamedInput.vue';
import {computed, ref, onMounted} from 'vue';
import {useMeasurementStore} from '@/stores/measurementStore/measurementStore.ts';
import {Quantity} from '@/client';
import CustomFileUpload from '@/components/elements/forms/CustomFileUpload.vue';

const props = defineProps<{
  paramKey: Parameter,
  definition: ParameterDefinition & ProfileParamDefinition | undefined;
  disabled?: boolean,
  phase: 'pre' | 'post'
}>()
const emits = defineEmits(['update'])
const mStore = useMeasurementStore()

function getComponent(param: ParameterDefinition) {
  switch (param.datatype) {
    case 'text': return InputText
    case 'dropdown': return Select
    case 'text_suggestions': return AutoComplete
    case 'text_box': return Textarea
    case 'float': return InputNumber
    case 'int': return InputNumber
    case 'boolean': return Checkbox
    case 'file': return CustomFileUpload
    default: return InputText
  }
}

const suggestions = ref<Array<string>>([])
const search = (event: any) => {
  const entry = String(event.query).toLowerCase()
  if (entry.length === 0) {
    suggestions.value = [...props.definition?.options ?? []]
  } else {
    suggestions.value = props.definition?.options?.filter(opt => String(opt).toLowerCase().includes(String(event.query).toLowerCase())) ?? [];
  }
}

function assembleFormEntry(value: any): Quantity | any {
  if(props.definition?.unit) {
    return {
      unit: props.definition.unit,
      value: value
    }
  } else if(props.definition?.datatype === 'boolean') {
    return value === 'false' ? false : Boolean(value)
  }
  return value
}

const getModelValue = computed(() => {
  const relevantForm = props.phase === 'pre' ? mStore.preMetaForm : mStore.postMetaForm
  if (props.definition?.unit && typeof relevantForm.parameters[props.paramKey] === 'object') {
    return (relevantForm.parameters[props.paramKey] as Quantity).value
  }
  return relevantForm.parameters[props.paramKey]
})

function update(event: any) {
  if(props.phase === 'pre') {
    mStore.preMetaForm.parameters[props.paramKey] = assembleFormEntry(event)
  } else {
    if(!mStore.postMetaForm) {
      mStore.postMetaForm = {
        version: '',
        profile: '',
        parameters: {}
      }
    }
    mStore.postMetaForm.parameters[props.paramKey] = assembleFormEntry(event)
  }
  emits('update')
}

onMounted(() => {
  if(props.definition?.default !== undefined) {
    update(props.definition.default)
  }
})
</script>

<template>
  <NamedInput
    v-if="definition"
    :title="`${definition?.label}${definition?.unit ? ' in ' + definition?.unit : ''}${definition?.required === 'required' ? ' *' : ''}`"
  >
    <component
      :is="getComponent(definition)"
      :model-value="definition.datatype === 'boolean' ? Boolean(getModelValue) : getModelValue"
      :options="definition.options"
      :suggestions="suggestions"
      :required="definition.required === 'required'"
      :invalid="definition.required === 'required' && (getModelValue === null || getModelValue === undefined || getModelValue === '')"
      :min-fraction-digits="0"
      :max-fraction-digits="definition.datatype === 'int' ? 0: 4"
      :use-grouping="false"
      :disabled="disabled || definition.type === 'implementation'"
      input-class="w-full"
      binary
      @complete="search"
      @update:model-value="update"
      @images="update"
    />
  </NamedInput>
</template>

<style scoped>

</style>