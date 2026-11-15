import { describe, expect, it } from 'vitest'
import { describeRecordingEvent } from '@/utils/recordingEvents.ts'

describe('describeRecordingEvent', () => {
  it('ignores other events', () => {
    expect(describeRecordingEvent({ message: 'state' })).toBeNull()
    expect(describeRecordingEvent({ message: 'other', data: {} })).toBeNull()
  })

  it('describes a finished recording', () => {
    const notice = describeRecordingEvent({
      message: 'recording/finished',
      data: { name: 'a.hdf5', size: 10, url: '/files/a.hdf5' }
    })
    expect(notice?.severity).toBe('success')
    expect(notice?.detail).toBe('a.hdf5 was saved.')
  })

  it('names the sources of several units', () => {
    const notice = describeRecordingEvent({
      message: 'recording/finished',
      data: {
        name: 'a.hdf5', size: 10, url: null,
        units: [
          { unit: 'pcan:1', source: 'STH-A' },
          { unit: 'pcan:2', source: 'STH-B' }
        ]
      }
    })
    expect(notice?.detail).toContain('2 units: STH-A, STH-B')
  })

  it('does not list a single unit', () => {
    const notice = describeRecordingEvent({
      message: 'recording/finished',
      data: {
        name: 'a.hdf5', size: 10, url: null,
        units: [{ unit: 'pcan:1', source: 'STH-A' }]
      }
    })
    expect(notice?.detail).toBe('a.hdf5 was saved.')
  })

  it('names the unit that failed', () => {
    const notice = describeRecordingEvent({
      message: 'recording/failed',
      data: {
        name: 'a.hdf5', size: 10, url: null, failed_unit: 'pcan:2',
        error: { type: 'StreamingTimeoutError', message: 'No data for 5 seconds' }
      }
    })
    expect(notice?.severity).toBe('error')
    expect(notice?.detail).toContain('Unit pcan:2 failed.')
    expect(notice?.detail).toContain('No data for 5 seconds')
  })

  it('describes a failure without details', () => {
    const notice = describeRecordingEvent({
      message: 'recording/failed', data: { name: 'a.hdf5', size: null, url: null }
    })
    expect(notice?.detail).toBe('a.hdf5: Unknown error')
  })
})
