<script setup lang="ts">
import InputNumber from 'primevue/inputnumber';
//import {Quantity} from '@/client';
import {ref, watch} from 'vue';
type Quantity = {
  value: number,
  unit: string,
}
const props = defineProps<{
  unit: string
  required: boolean
  modelValue: Quantity|undefined
}>()

const _value = ref<number|undefined>(undefined)
const _unit = ref<string|undefined>(undefined)

const emit = defineEmits<{
  'update:modelValue': [Quantity|undefined],
}>()

watch(props, (newVal, oldVal) => {
  _unit.value = newVal.unit;
  if(newVal.modelValue && newVal.modelValue.value !== oldVal?.modelValue?.value) {
    _value.value = newVal.modelValue.value;
    emit('update:modelValue', {
      value: _value.value,
      unit: _unit.value
    })
  }
}, {
  immediate: true,
  deep: true,
})

function update(event: any) {
  event?.originalEvent?.preventDefault()
  if(event.value === null) {
    _value.value = undefined;
    emit('update:modelValue', undefined)
    return;
  }
  if(typeof event.value === 'number') {
    _value.value = event.value;
    if(_value.value && _unit.value) {
      emit('update:modelValue', {
        value: _value.value,
        unit: _unit.value
      })
    }
    return;
  }
  throw new Error('MetaInputFloatQty: Value must be a number')
}
</script>

<template>
  <InputNumber
    v-model="_value"
    :min-fraction-digits="0"
    :max-fraction-digits="5"
    :use-grouping="false"
    :invalid="required && !_value"
    :form-control="{}"
    @input="update"
  />
</template>