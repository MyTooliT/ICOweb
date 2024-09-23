import {
  Ref,
  ref
} from 'vue';

export function useLoadingHandler<T = any>(fn: (...args: any[]) => Promise<T>): {
  loading: Ref<boolean>,
  call: (...args: any[]) => Promise<T>
} {
  const loading = ref<boolean>(false)

  async function call(...args: any[]): Promise<T> {
    loading.value = true
    try {
      const result = await fn(...args)
      loading.value = false
      return result
    } catch(e) {
      loading.value = false
      throw e
    }
  }

  return {
    loading,
    call
  }
}