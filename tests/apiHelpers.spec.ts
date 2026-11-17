import { describe, expect, it, vi } from 'vitest'

vi.mock('primevue/toasteventbus', () => ({ default: { emit: vi.fn() } }))

import { describeDetail } from '@/api/api.ts'
import { forUnit } from '@/api/icoapi.ts'

describe('forUnit', () => {
  it('adds the unit as query parameter', () => {
    expect(forUnit('sth', 'pcan:PCAN_USBBUS2')).toBe('sth?unit=pcan%3APCAN_USBBUS2')
  })

  it('keeps the endpoint without unit', () => {
    expect(forUnit('sth')).toBe('sth')
    expect(forUnit('sth', null)).toBe('sth')
  })

  it('extends an existing query', () => {
    expect(forUnit('a?b=1', 'u')).toBe('a?b=1&unit=u')
  })
})

describe('describeDetail', () => {
  it('uses text as it is', () => {
    expect(describeDetail('No STU')).toBe('No STU')
  })

  it('uses the message of an object (units that are not ready)', () => {
    expect(describeDetail({ message: '1 of 2 units are not ready', ready: false }))
      .toBe('1 of 2 units are not ready')
  })

  it('describes everything else', () => {
    expect(describeDetail([{ msg: 'bad' }])).toBe('[{"msg":"bad"}]')
  })
})
