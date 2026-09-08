import { describe, it, expect } from 'vitest'
import { formatAttributeLabel, formatAttributeValue, formatSupplyVoltage } from '@/utils/helper.ts'

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

describe('formatAttributeLabel', () => {
  it('title-cases a plain snake_case key', () => {
    expect(formatAttributeLabel('tool_name')).toBe('Tool Name')
  })

  it('upper-cases known domain acronyms instead of title-casing them', () => {
    expect(formatAttributeLabel('adc_prescaler')).toBe('ADC Prescaler')
    expect(formatAttributeLabel('sth_mac_address')).toBe('STH MAC Address')
    expect(formatAttributeLabel('stu_mac_address')).toBe('STU MAC Address')
  })

  it('handles a single-word key', () => {
    expect(formatAttributeLabel('conversion')).toBe('Conversion')
  })
})

describe('formatAttributeValue', () => {
  it('formats a *_voltage key like formatSupplyVoltage', () => {
    expect(formatAttributeValue('start_supply_voltage', 3.3)).toBe('3.30 V')
    expect(formatAttributeValue('adc_reference_voltage', '3.3')).toBe('3.30 V')
  })

  it('falls back to the raw value for a non-voltage key', () => {
    expect(formatAttributeValue('sth_mac_address', '08-6B-D7-01-DE-81')).toBe('08-6B-D7-01-DE-81')
  })

  it('falls back to the raw string for an unparseable *_voltage value', () => {
    expect(formatAttributeValue('adc_reference_voltage', 'unknown')).toBe('unknown')
  })
})
