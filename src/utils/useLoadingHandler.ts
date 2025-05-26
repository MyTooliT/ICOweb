import {
  Ref,
  ref
} from 'vue';

export function useLoadingHandler<T = any>(fn: (...args: any[]) => Promise<T>): {
  loading: Ref<boolean>,
  call: (...args: any[]) => Promise<T>,
  error: Ref<boolean>,
  errorMessage: Ref<string>
} {
  const loading = ref<boolean>(false)
  const error = ref<boolean>(false)
  const msg = ref<string>('')
  async function call(...args: any[]): Promise<T> {
    loading.value = true
    try {
      const result = await fn(...args)
      loading.value = false
      error.value = false
      return result
    } catch(e: any) {
      loading.value = false
      error.value = true
      msg.value = 'Unknown error'
      if(e.message) {
        try {
          const parsed = JSON.parse(e.message)
          if(parsed.detail) {
            msg.value = parsed.detail
          }
        } catch {
          msg.value = e.message
        }
      }
      throw new Error(...e)
    }
  }

  return {
    loading,
    call,
    error,
    errorMessage: msg
  }
}