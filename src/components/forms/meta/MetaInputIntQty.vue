<script setup lang="ts">
import InputNumber from 'primevue/inputnumber';
import {Quantity} from '@/client';
import { ref, watch } from 'vue';

const props = defineProps<{
  required: boolean
  unit: string
  modelValue: Quantity|undefined
}>()

const _value = ref<number|undefined>(undefined)
const _unit = ref<string|undefined>(props.unit)

const emit = defineEmits<{
  'update:modelValue': [Quantity|undefined],
}>()

watch(props, (newVal, oldVal) => {
  if(newVal.modelValue && newVal.modelValue !== oldVal?.modelValue) {
    _unit.value = newVal.modelValue.unit;
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
  emit('update:modelValue', undefined)
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
      return;
    }
  }
  console.log(event)
  throw new Error('MetaInputIntQty: Value must be a number')
}
</script>

<template>
  <InputNumber
    v-model="_value"
    :min-fraction-digits="0"
    :max-fraction-digits="0"
    :use-grouping="false"
    :invalid="required && !_value"
    @input="update"
  />
</template>