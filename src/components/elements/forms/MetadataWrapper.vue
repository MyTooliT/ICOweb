<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import { useYamlConfig } from '@/utils/useYamlConfig'

import {ParameterDefinition, ParameterKey, ProcessDefinition, ProcessKey, ParameterState} from '@/types/metadata';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import {AutoComplete} from 'primevue';
import InputNumber from 'primevue/inputnumber';
import NamedInput from '@/components/elements/forms/NamedInput.vue';
import {useMeasurementStore} from '@/stores/measurementStore/measurementStore.ts';
import {UnifiedMetadata} from '@/client';

const mStore = useMeasurementStore()
const processKey: ProcessKey = import.meta.env.VITE_PROCESS || 'milling'
mStore.metadataForm['process'] = processKey
const { config, error, reload } = useYamlConfig()
const currentProcess = computed<ProcessDefinition | undefined>(() => config.value?.processes?.[processKey])
const parameters = computed<Record<ParameterKey, ParameterDefinition> | undefined>(() => config.value?.parameters || undefined)

function getComponent(param: ParameterDefinition) {
  switch (param.datatype) {
    case 'text': return InputText
    case 'dropdown': return Select
    case 'text_suggestions': return AutoComplete
    case 'float': return InputNumber
    case 'int': return InputNumber
    default: return InputText
  }
}

const filteredOptions = ref<Record<ParameterKey, Array<string>>>({})

defineProps<{
  disabled: boolean,
}>()


function validate(process: ProcessDefinition, form: UnifiedMetadata) {
  const parameters = Object.entries(process.parameters) as [ParameterKey, ParameterState][]
  let valid = true
  parameters.forEach(([key, state]) => {
    if(state === 'required') {
      let value = form[key]
      if(typeof value ==='object') {
        value = value?.value
      }
      valid = valid && (value !== null && value !== undefined && (typeof value === 'string' ? (value.length > 0) : (value > 0)))
    }
  })
  mStore.metadataValid = valid
}

watch(mStore.metadataForm, () => {
  if(currentProcess.value) {
    validate(currentProcess.value, mStore.metadataForm)
  }}, {
  immediate: true,
  deep: true,
})
onMounted(async () => {
  await reload()
  if (currentProcess.value) {
    validate(currentProcess.value, mStore.metadataForm)
  }
})

type ProcessDropdownEntry = {
  key: ProcessKey,
  label: string
}

const options = computed<Array<ProcessDropdownEntry>>(() => {
  if (!config.value || !config.value.processes) {
    return []
  }
  const list = Object.entries(config.value.processes) as [ProcessKey, ProcessDefinition][]
  const entries: Array<ProcessDropdownEntry> = list.map(([k, d]) => {
    const entry: ProcessDropdownEntry = {
      label: d.label,
      key: k
    }
    return entry
  })
  return entries
})

function getValue(key: ParameterKey, form: UnifiedMetadata = mStore.metadataForm): any {
  if(typeof form[key] === 'object') {
    return form[key]?.value
  } else {
    return form[key]
  }
}
</script>

<template>
  <div v-if="parameters && currentProcess">
    <div v-if="error">
      {{ error }}
    </div>

    <form
      class="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(30ch,1fr))]"
    >
      <div
        v-for="[id, state] in (Object.entries(currentProcess.parameters) as [ParameterKey, ParameterState][]).filter(([_, value]) => value !== 'hidden')"
        :key="id"
        class="w-full"
      >
        <NamedInput
          :title="parameters[id].label"
          class="w-full"
        >
          <component
            :is="getComponent(parameters[id])"
            :model-value="getValue(id)"
            :suggestions="filteredOptions[id]"
            :options="id === 'process' ? options : parameters[id].options"
            :option-label="id === 'process' ? 'label' : null"
            :option-value="id === 'process' ? 'key' : null"
            :use-grouping="false"
            :min-fraction-digits="0"
            :max-fraction-digits="parameters[id].datatype === 'int' ? 0 : 4"
            :disabled="disabled"
            :required="state === 'required'"
            :invalid="state === 'required' && (getValue(id) === 0 || getValue(id) === '')"
            class="w-full"
            input-class="w-full"
            @complete="(event: any) => {
              filteredOptions[id] = [...(parameters && parameters[id] && parameters[id].options ? parameters[id].options : [])].filter(opt => String(opt).toLowerCase().includes(event.query.toLowerCase()))
            }"
            @update:model-value="(event: any) => {
              if(mStore.metadataForm[id] !== null) {
                const value_to_safe = parameters[id].datatype.includes('text') ? event.toString() : event
                if(typeof mStore.metadataForm[id] === 'object') {
                  mStore.metadataForm[id].value = value_to_safe
                } else {
                  (mStore.metadataForm[id] as any) = value_to_safe
                }
              }
            }"
          />
        </NamedInput>
      </div>
    </form>
  </div>
</template>
