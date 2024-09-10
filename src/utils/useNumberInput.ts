import {
  computed,
  ref
} from 'vue';

export function useNumberInput(
  matchType: 'Empty' | 'NotEmpty' = 'Empty',
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER
) {
  const content = ref<number | null>(null)
  const validityVisible = ref<boolean>(false)

  const valid = computed<boolean>(() => {
    if(matchType === 'Empty') {
      return content.value ? content.value <= max : true
    }
    // else: matchType = 'NotEmpty'
    return (
      content.value
        ? content.value >= min &&
          content.value <= max
        : false
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