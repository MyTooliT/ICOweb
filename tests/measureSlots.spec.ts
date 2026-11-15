import { describe, expect, it } from 'vitest'
import type { MeasurementInstructions_Output } from '@/client'
import {
  slotsFromInstructions,
  slotsFromSelection,
  unitOfSource
} from '@/utils/measureSlots.ts'

function instructions(
  overrides: Partial<MeasurementInstructions_Output> = {}
): MeasurementInstructions_Output {
  return {
    name: null,
    mac_address: 'x',
    time: null,
    first: { sensor_id: 'acc' },
    second: { sensor_id: 'temp' },
    third: { sensor_id: null },
    ift_requested: false,
    ift_channel: '',
    ift_window_width: 150,
    ...overrides
  }
}

describe('slotsFromInstructions', () => {
  it('uses the channels of the measurement', () => {
    const slots = slotsFromInstructions(instructions(), null)
    expect(slots.first).toEqual({ active: true, sensorId: 'acc' })
    expect(slots.second).toEqual({ active: true, sensorId: 'temp' })
    expect(slots.third).toEqual({ active: false, sensorId: null })
  })

  it('replaces channels for a unit, channel by channel', () => {
    const slots = slotsFromInstructions(instructions({
      units: {
        'pcan:2': { first: { sensor_id: 'acc50' }, second: { sensor_id: null } }
      }
    }), 'pcan:2')

    expect(slots.first.sensorId).toBe('acc50')
    expect(slots.second).toEqual({ active: false, sensorId: null })
  })

  it('keeps the channels for units without instructions of their own', () => {
    const slots = slotsFromInstructions(instructions({
      units: { 'pcan:2': { first: { sensor_id: 'acc50' } } }
    }), 'pcan:1')

    expect(slots.first.sensorId).toBe('acc')
  })
})

describe('slotsFromSelection', () => {
  it('combines the used channels and the selected sensors', () => {
    const slots = slotsFromSelection(
      { first: true, second: false, third: false },
      { first: 'acc', second: 'temp', third: null }
    )
    expect(slots.first).toEqual({ active: true, sensorId: 'acc' })
    expect(slots.second).toEqual({ active: false, sensorId: 'temp' })
  })
})

describe('unitOfSource', () => {
  it('maps the sources of a measurement to their units', () => {
    expect(unitOfSource([
      { unit: 'pcan:1', source: 'STH-A' },
      { unit: 'pcan:2', source: 'STH-B' }
    ])).toEqual({ 'STH-A': 'pcan:1', 'STH-B': 'pcan:2' })
    expect(unitOfSource(null)).toEqual({})
  })
})
