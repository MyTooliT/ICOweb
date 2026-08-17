import { describe, it, expect } from 'vitest'
import { formatSupplyVoltage } from '@/utils/helper.ts'

describe('formatSupplyVoltage', () => {
  it('formats a valid number with two decimals and a V suffix', () => {
    expect(formatSupplyVoltage(3.3)).toBe('3.30 V')
    expect(formatSupplyVoltage(3.14159)).toBe('3.14 V')
  })

  it('formats a numeric string', () => {
    expect(formatSupplyVoltage('3.3')).toBe('3.30 V')
  })

  it('returns null for undefined', () => {
    expect(formatSupplyVoltage(undefined)).toBeNull()
  })

  it('returns null for null', () => {
    expect(formatSupplyVoltage(null)).toBeNull()
  })

  it('returns null for a non-numeric string', () => {
    expect(formatSupplyVoltage('not-a-number')).toBeNull()
  })
})
