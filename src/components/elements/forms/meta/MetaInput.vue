<script setup lang="ts">
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import NamedInput from '@/components/elements/forms/NamedInput.vue';
import {computed, onMounted, watch} from 'vue';
import {useMeasurementStore} from '@/stores/measurementStore/measurementStore.ts';
import {Quantity} from '@/client';
import CustomFileUpload, {Base64Map} from '@/components/elements/forms/CustomFileUpload.vue';
import {AnyMetadataParameterDefinition, hasUnit, MetadataPhaseKey} from '@/utils/metadataConfig.ts';
import MetaTextSuggestable from '@/components/elements/forms/meta/MetaTextSuggestable.vue';
import MetaInputIntQty from '@/components/elements/forms/meta/MetaInputIntQty.vue';
import MetaInputFloatQty from '@/components/elements/forms/meta/MetaInputFloatQty.vue';

const props = defineProps<{
  definition: AnyMetadataParameterDefinition;
  disabled?: boolean,
  phase: MetadataPhaseKey
}>()
//const emits = defineEmits(['update'])
const mStore = useMeasurementStore()

const relevantForm = computed(() => {
  if(props.phase === 'pre') {
    return mStore.preMetaForm
  } else {
    return mStore.postMetaForm
  }
})

/*function update(event: any) {
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
}*/

function setDefaults() {
  if(props.definition?.default !== undefined) {
    switch (props.definition.datatype) {
      case 'image':
        relevantForm.value.parameters[props.definition.id] = {}
        break;
      case 'float_qty':
      case 'int_qty':
        relevantForm.value.parameters[props.definition.id] = {
          value: props.definition.default,
          unit: props.definition.unit
        }
        break;
      default:
        relevantForm.value.parameters[props.definition.id] = props.definition.default
        break;
    }
  }
}

onMounted(() => {
  setDefaults()
})

const title = computed(() => {
  let needsAsterisk = props.definition.required === 'required' && !['restricted', 'implementation'].includes(props.definition?.type)
  return `${props.definition.label}${hasUnit(props.definition) ? ' in ' + props.definition.unit : ''}${needsAsterisk ? ' *' : ''}`
})

watch(props, setDefaults)
</script>

<template>
  <NamedInput
    v-if="definition"
    :tooltip="definition.description"
    :title="title"
  >
    <MetaTextSuggestable
      v-if="definition.datatype === 'text_suggestions'"
      v-model="relevantForm.parameters[definition.id] as string|undefined"
      :options="definition.options"
    />
    <InputNumber
      v-else-if="definition.datatype === 'int'"
      v-model="relevantForm.parameters[definition.id] as number|undefined"
      :min-fraction-digits="0"
      :max-fraction-digits="0"
      :use-grouping="false"
      :invalid="(definition.required === 'required' || definition.required === 'restricted') && relevantForm.parameters[definition.id] === undefined"
    />
    <InputNumber
      v-else-if="definition.datatype === 'float'"
      v-model="relevantForm.parameters[definition.id] as number|undefined"
      :min-fraction-digits="0"
      :max-fraction-digits="4"
      :use-grouping="false"
      :invalid="(definition.required === 'required' || definition.required === 'restricted') && relevantForm.parameters[definition.id] === undefined"
    />
    <MetaInputIntQty
      v-else-if="definition.datatype === 'int_qty'"
      v-model="relevantForm.parameters[definition.id] as Quantity|undefined"
      :unit="definition.unit"
      :required="definition.required === 'required' || definition.required === 'restricted'"
    />
    <MetaInputFloatQty
      v-else-if="definition.datatype === 'float_qty'"
      v-model="mStore.preMetaForm.parameters[definition.id] as Quantity|undefined"
      :unit="definition.unit"
      :required="definition.required === 'required' || definition.required === 'restricted'"
    />
    <Checkbox
      v-else-if="definition.datatype === 'boolean'"
      v-model="relevantForm.parameters[definition.id]"
      binary
      :invalid="(definition.required === 'required' || definition.required === 'restricted') && relevantForm.parameters[definition.id] === undefined"
    />
    <InputText
      v-else-if="definition.datatype === 'text'"
      v-model="relevantForm.parameters[definition.id] as string|undefined"
      :invalid="(definition.required === 'required' || definition.required === 'restricted') && (relevantForm.parameters[definition.id] === undefined || relevantForm.parameters[definition.id] === '')"
    />
    <Textarea
      v-else-if="definition.datatype === 'text_box'"
      v-model="relevantForm.parameters[definition.id] as string|undefined"
      :invalid="(definition.required === 'required' || definition.required === 'restricted') && (relevantForm.parameters[definition.id] === undefined || relevantForm.parameters[definition.id] === '')"
    />
    <Select
      v-else-if="definition.datatype === 'dropdown'"
      v-model="relevantForm.parameters[definition.id] as string|undefined"
      :options="definition.options as any[]"
      :invalid="(definition.required === 'required' || definition.required === 'restricted') && (relevantForm.parameters[definition.id] === undefined || relevantForm.parameters[definition.id] === '')"
    />
    <CustomFileUpload
      v-else-if="definition.datatype === 'image'"
      v-model="relevantForm.parameters[definition.id] as Base64Map|undefined"
      :required="definition.required === 'required' || definition.required === 'restricted'"
    />
  </NamedInput>
</template>