import {
  Ref,
  ref
} from 'vue';

export function useLoadingHandler<T = any>(fn: () => Promise<T>): {
  loading: Ref<boolean>,
  call: () => Promise<T>
} {
  const loading = ref<boolean>(false)

  async function call(): Promise<T> {
    loading.value = true
    const result = await fn()
    loading.value = false
    return result
  }

  return {
    loading,
    call
  }
}