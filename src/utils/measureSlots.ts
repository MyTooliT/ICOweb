import { MeasurementInstructions_Output, MeasurementUnit } from '@/client';
import {
  ActiveChannels,
  measurementChannels,
  TChannelMap
} from '@/stores/measurementStore/measurementStore.ts';

export type TSlot = typeof measurementChannels[number]

/** What is measured on the three channels of one unit */
export type TSlots = Record<TSlot, { active: boolean, sensorId: string | null }>

/**
 * The channels of the instructions of a measurement for one unit.
 *
 * Instructions for a unit (`units`) replace the channels of the measurement
 * for that unit, channel by channel.
 *
 * @param instructions The instructions of the (running) measurement
 * @param unit The unit, `null` without multi STU support
 */
export function slotsFromInstructions(
  instructions: MeasurementInstructions_Output,
  unit: string | null
): TSlots {
  const own = unit ? instructions.units?.[unit] : undefined
  const result = {} as TSlots
  measurementChannels.forEach(slot => {
    const sensorId = (own?.[slot] ?? instructions[slot])?.sensor_id ?? null
    result[slot] = { active: sensorId !== null, sensorId }
  })
  return result
}

/**
 * The channels chosen in this browser.
 *
 * @param active Which of the channels are used
 * @param selected The sensor of every channel
 */
export function slotsFromSelection(
  active: ActiveChannels,
  selected: TChannelMap
): TSlots {
  const result = {} as TSlots
  measurementChannels.forEach(slot => {
    result[slot] = { active: active[slot], sensorId: selected[slot] }
  })
  return result
}

/**
 * Get the unit of every source of a measurement.
 *
 * @returns Unit by name of the source
 */
export function unitOfSource(
  units: MeasurementUnit[] | null | undefined
): Record<string, string> {
  return Object.fromEntries((units ?? []).map(unit => [unit.source, unit.unit]))
}
