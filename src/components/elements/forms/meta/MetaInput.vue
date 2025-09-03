<script setup lang="ts">
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import {AutoComplete, Textarea} from 'primevue';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import NamedInput from '@/components/elements/forms/NamedInput.vue';
import {computed, ref, onMounted, watch} from 'vue';
import {useMeasurementStore} from '@/stores/measurementStore/measurementStore.ts';
import {Quantity} from '@/client';
import CustomFileUpload from '@/components/elements/forms/CustomFileUpload.vue';
import {MetadataParameterInformation, assembleFormEntry} from '@/utils/metadataConfig.ts';

const props = defineProps<{
  definition: MetadataParameterInformation;
  disabled?: boolean,
  phase: 'pre' | 'post'
}>()
const emits = defineEmits(['update'])
const mStore = useMeasurementStore()

function getComponent(param: MetadataParameterInformation) {
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

const getModelValue = computed(() => {
  const relevantForm = props.phase === 'pre' ? mStore.preMetaForm : mStore.postMetaForm
  if (typeof relevantForm.parameters[props.definition.id] === 'object') {
    // either image or quantity
    if(props.definition?.unit) {
      // quantity
      return (relevantForm.parameters[props.definition.id] as Quantity).value
    } else {
      // image
      return relevantForm.parameters[props.definition.id] ?? {}
    }
  }
  return relevantForm.parameters[props.definition.id]
})

function update(event: any) {
  if(props.phase === 'pre') {
    mStore.preMetaForm.parameters[props.definition.id] = assembleFormEntry(event, props.definition)
  } else {
    if(!mStore.postMetaForm) {
      mStore.postMetaForm = {
        version: '',
        profile: '',
        parameters: {}
      }
    }
    mStore.postMetaForm.parameters[props.definition.id] = assembleFormEntry(event, props.definition)
  }
  emits('update')
}

function setDefaults() {
  if(props.definition?.default !== undefined) {
    update(props.definition.default)
  } else {
    if(props.definition?.datatype === 'file') {
      update({})
    }
  }
}

onMounted(() => {
  setDefaults()
})

const title = computed(() => {
  let needsAsterik = props.definition?.required === 'required'
  if(props.definition?.type) {
    needsAsterik = needsAsterik && !['restricted', 'implementation'].includes(props.definition?.type)
  }
  return `${props.definition?.label}${props.definition?.unit ? ' in ' + props.definition?.unit : ''}${needsAsterik ? ' *' : ''}`
})

watch(props, setDefaults)
</script>

<template>
  <NamedInput
    v-if="definition"
    :tooltip="definition.description"
    :title="title"
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
      :disabled="disabled || definition.type === 'implementation' || definition.required === 'restricted'"
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