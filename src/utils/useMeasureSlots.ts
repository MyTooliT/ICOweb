import { MeasurementStatus } from '@/client';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { HolderConfig, TAssignedSensor } from '@/stores/hardwareStore/classes/HolderConfig.ts';
import { Sensor } from '@/stores/hardwareStore/classes/Sensor.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import {
  ActiveChannels,
  measurementChannels,
  useMeasurementStore
} from '@/stores/measurementStore/measurementStore.ts';
import {
  slotsFromInstructions,
  slotsFromSelection,
  TSlot,
  TSlots
} from '@/utils/measureSlots.ts';
import { computed } from 'vue';

export type TSlotSensor = { channel?: number, sensor: Sensor }

/**
 * What the Measure page shows about the devices and channels.
 *
 * Several people can use the same device at the same time (e.g. remotely).
 * The API is the source of truth for the connected sensor devices and for a
 * running measurement, so everything about them comes from the system state,
 * not from the settings stored in this browser. This also works for a
 * measurement another client started.
 */
export function useMeasureSlots() {
  const gStore = useGeneralStore()
  const hwStore = useHardwareStore()
  const mStore = useMeasurementStore()

  const running = computed<boolean>(() => gStore.systemState.running)
  const runningStatus = computed<MeasurementStatus | null>(() =>
    gStore.systemState.running ? gStore.systemState.measurementStatus : null
  )
  const runningInstructions = computed(() => runningStatus.value?.instructions ?? null)

  /** All units (`null` without multi STU support) */
  const units = computed(() => gStore.systemState.units)
  const multiUnit = computed<boolean>(() => gStore.systemState.multiUnit)

  // Sensor device the API is connected to (of the first unit)
  const connectedSTH = computed(() => gStore.systemState.sthConnected)
  const hasDevice = computed<boolean>(() => {
    if(running.value) return true
    if(multiUnit.value) {
      return (units.value ?? []).some(unit => unit.sth_connected)
    }
    return connectedSTH.value !== null
  })

  // Holder configuration chosen for the sensor device in this browser, or the
  // default one (e.g. in a browser that never listed the sensor devices)
  function holderOf(unit: string | null): HolderConfig | undefined {
    return (unit ? hwStore.holderFor(unit) : hwStore.activeHolder)
      ?? hwStore.getHolder(hwStore.defaultHolderID)
  }
  const holder = computed(() => holderOf(null))

  /** The sensors chosen for the unit in this browser */
  function selectedFor(unit: string | null) {
    return unit
      ? (mStore.unitChannels[unit] ?? mStore.selectedChannels)
      : mStore.selectedChannels
  }

  /** Which channels the unit uses in this browser */
  function activeFor(unit: string | null): ActiveChannels {
    return unit
      ? (mStore.unitActive[unit] ?? mStore.activeChannels)
      : mStore.activeChannels
  }

  /** The channels of a unit: of the running measurement, otherwise the local selection */
  function slotsFor(unit: string | null): TSlots {
    const instructions = runningInstructions.value
    return instructions
      ? slotsFromInstructions(instructions, unit)
      : slotsFromSelection(activeFor(unit), selectedFor(unit))
  }
  const slots = computed<TSlots>(() => slotsFor(null))

  function findSensor(
    sensorId: string | null | undefined, unit: string | null = null
  ): TSlotSensor | undefined {
    if(!sensorId) return undefined
    const assigned = holderOf(unit)?.sensors.find(
      sens => sens.sensor.sensor_id === sensorId)
    if(assigned) return assigned
    const sensor = hwStore.sensorList.find(sens => sens.sensor_id === sensorId)
    return sensor ? { sensor } : undefined
  }

  function sensorRepr(slotSensor?: TAssignedSensor | TSlotSensor): string {
    if(!slotSensor) return ''
    return slotSensor.channel === undefined
      ? slotSensor.sensor.name
      : `[${slotSensor.channel}] ${slotSensor.sensor.name}`
  }

  function slotRepr(slot: TSlot, unit: string | null = null): string {
    return sensorRepr(findSensor(slotsFor(unit)[slot].sensorId, unit))
  }

  const iftRequested = computed<boolean>(() =>
    runningInstructions.value ? runningInstructions.value.ift_requested : mStore.IFTRequested
  )
  const iftChannel = computed<TSlot>(() => {
    const channel = runningInstructions.value?.ift_channel
    return (measurementChannels as readonly string[]).includes(channel ?? '')
      ? channel as TSlot
      : mStore.IFTChannel
  })

  /**
   * Make sure every unit has valid sensors (multi STU support).
   *
   * Units start with the selection of the first one. A sensor that the
   * holder of the unit does not have is replaced: the first channel falls back
   * to the first sensor of the holder, the others are not used.
   */
  function ensureUnitChannels(): void {
    (units.value ?? []).forEach(unit => {
      const ids = (holderOf(unit.unit)?.sensors ?? []).map(
        sens => sens.sensor.sensor_id)
      // The holder is not known yet
      if(ids.length === 0) return
      const next = { ...(mStore.unitChannels[unit.unit] ?? mStore.selectedChannels) }
      measurementChannels.forEach(slot => {
        const id = next[slot]
        if(id !== null && !ids.includes(id)) next[slot] = null
      })
      if(next.first === null) next.first = ids[0]
      if(JSON.stringify(next) !== JSON.stringify(mStore.unitChannels[unit.unit])) {
        mStore.unitChannels[unit.unit] = next
      }
      // The channels of a unit start like the shared ones, but only the
      // channels its holder has can be used
      const active = { ...(mStore.unitActive[unit.unit] ?? mStore.activeChannels) }
      measurementChannels.forEach((slot, number) => {
        if(number >= ids.length) active[slot] = false
      })
      active.first = true
      if(JSON.stringify(active) !== JSON.stringify(mStore.unitActive[unit.unit])) {
        mStore.unitActive[unit.unit] = active
      }
    })
  }

  return {
    ensureUnitChannels,
    running,
    runningStatus,
    runningInstructions,
    units,
    multiUnit,
    connectedSTH,
    hasDevice,
    holder,
    holderOf,
    selectedFor,
    activeFor,
    slots,
    slotsFor,
    findSensor,
    sensorRepr,
    slotRepr,
    iftRequested,
    iftChannel
  }
}
