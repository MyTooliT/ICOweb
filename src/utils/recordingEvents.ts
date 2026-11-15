import { MeasurementUnit } from '@/client';

/** An event of the API about a recording (`recording/finished`, `recording/failed`) */
export type RecordingEvent = {
  message: string
  data: {
    name: string
    size: number | null
    url: string | null
    units?: MeasurementUnit[]
    failed_unit?: string
    error?: { type: string, message: string }
  }
}

export type RecordingNotice = {
  severity: 'success' | 'error'
  summary: string
  detail: string
}

/**
 * Describe an event of the API about a recording for the user.
 *
 * @returns What to show, or `null` if the event is not about a recording.
 */
export function describeRecordingEvent(event: {
  message?: string, data?: unknown
}): RecordingNotice | null {
  if(event.message !== 'recording/finished' && event.message !== 'recording/failed') {
    return null
  }
  const data = (event as RecordingEvent).data
  const units = data?.units ?? []
  // With several units name the sources: they are the names in the file
  const sources = units.length > 1
    ? ` (${units.length} units: ${units.map(unit => unit.source).join(', ')})`
    : ''

  if(event.message === 'recording/finished') {
    return {
      severity: 'success',
      summary: 'Recording finished',
      detail: `${data?.name ?? 'The measurement'} was saved${sources}.`
    }
  }
  const failed = data?.failed_unit ? ` Unit ${data.failed_unit} failed.` : ''
  return {
    severity: 'error',
    summary: 'Recording failed',
    detail: `${data?.name ?? 'The measurement'}${sources}:`
      + `${failed} ${data?.error?.message ?? 'Unknown error'}`.trimEnd()
  }
}
