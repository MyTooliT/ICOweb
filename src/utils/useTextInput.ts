import {
  computed,
  ref
} from 'vue';
import {
  matchExact,
  matchExactOrEmpty
} from './validation.ts';

export function useTextInput(
  matchType: 'Empty' | 'NotEmpty' = 'Empty',
  reg: RegExp | null = null,
  min = 1,
  max = 30
) {
  const content = ref<string>('')
  const validityVisible = ref<boolean>(false)

  const valid = computed<boolean>(() => {
    if(matchType === 'Empty') {
      return (
        content.value.length <= max &&
        (reg
          ? matchExactOrEmpty(content.value, reg)
          : true)
      )
    }
    // else: matchType = 'NotEmpty
    return (
      content.value.length >= min &&
      content.value.length <= max &&
      (reg
        ? matchExact(content.value, reg)
        : true)
    )
  })

  const invalid = computed<boolean>(() => !valid.value)

  const visiblyValid = computed<boolean | undefined>(() => {
    return validityVisible.value
      ? valid.value
      : undefined
  })

  const visiblyInvalid = computed<boolean | undefined>(() => {
    return validityVisible.value
      ? invalid.value
      : undefined
  })

  function setVisibility(visible: boolean) {
    validityVisible.value = visible
  }

  return {
    content,
    valid,
    invalid,
    validityVisible,
    visibleValid: visiblyValid,
    visiblyInvalid,
    setVisibility
  }
}