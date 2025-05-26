import {
  Ref,
  ref
} from 'vue';

type TError = {
  isError: boolean,
  error: unknown | undefined
}

export function useLoadingHandler<T = any>(fn: (...args: any[]) => Promise<T>): {
  loading: Ref<boolean>,
  call: (...args: any[]) => Promise<T>,
  error: Ref<TError>
} {
  const loading = ref<boolean>(false)
  const error = ref<TError>({
    isError: false,
    error: undefined
  })
  async function call(...args: any[]): Promise<T> {
    loading.value = true
    try {
      const result = await fn(...args)
      loading.value = false
      return result
    } catch(e) {
      loading.value = false
      error.value.isError = true
      error.value.error = e
      throw e
    }
  }

  return {
    loading,
    call,
    error
  }
}