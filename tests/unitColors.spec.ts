import { describe, expect, it } from 'vitest'
import { unitColor, unitLabel } from '@/utils/unitColors'

describe('unitColors', () => {
  it('gives every unit its own colour and wraps around', () => {
    expect(unitColor(0)).not.toBe(unitColor(1))
    expect(unitColor(6)).toBe(unitColor(0))
    expect(unitLabel(0)).toBe('U1')
  })
})
