import { computed, onBeforeUnmount, onMounted, Ref, ref } from 'vue';

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return hours > 0 ? `${hours}:${mmss}` : mmss
}

/**
 * Running time of a measurement, updated every second.
 *
 * The API reports the start time with UTC offset, so this is also correct in
 * other time zones.
 *
 * @param start The start time of the measurement (ISO 8601) or nothing
 */
export function useElapsed(start: Ref<string | null | undefined>) {
  const now = ref<number>(Date.now())
  let clock: number | undefined = undefined

  onMounted(() => {
    clock = window.setInterval(() => now.value = Date.now(), 1000)
  })
  onBeforeUnmount(() => {
    if(clock !== undefined) window.clearInterval(clock)
  })

  const startTime = computed<Date | null>(() =>
    start.value ? new Date(start.value) : null)
  const elapsed = computed<string | null>(() => {
    if(!startTime.value) return null
    return formatDuration(Math.max(
      0, Math.floor((now.value - startTime.value.getTime()) / 1000)))
  })
  return { startTime, elapsed }
}
