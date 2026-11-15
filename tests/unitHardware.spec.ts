import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const disconnectCAN = vi.fn()
vi.mock('@/api/icoapi.ts', () => ({
  disconnectCAN: (unit: string) => disconnectCAN(unit),
  resetCAN: () => Promise.resolve()
}))
vi.mock('@/message', () => ({ useMessageBus: () => ({ error: vi.fn() }) }))

import UnitHardware from '@/components/misc/UnitHardware.vue'
import { STUDevice } from '@/stores/hardwareStore/classes/STUDevice.ts'
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts'

const UNIT = 'pcan:PCAN_USBBUS1'
const unit = {
  unit: UNIT,
  network: { interface: 'pcan', channel: 'x', bitrate: 1000000 },
  stu_connected: true,
  sth_connected: { name: 'STH-A', mac_address: '00-00-00-00-00-0A' }
}

function mountUnit() {
  return mount(UnitHardware, {
    props: { unit, index: 1 },
    global: { stubs: { STHDeviceTable: true } }
  })
}

describe('UnitHardware', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    disconnectCAN.mockReset()
    disconnectCAN.mockResolvedValue({})
  })

  it('does not call an STU connected that is not loaded', () => {
    const text = mountUnit().text()
    expect(text).toContain('Attach the STU')
    expect(text).toContain('Attach STU')
    // The sensor devices wait for the STU
    expect(text).toContain('Attach the STU of this unit first')
  })

  it('shows the connection once the STU is loaded', () => {
    useHardwareStore().STUDeviceList = [
      new STUDevice(1, 'STU-1', '00-00-00-00-00-01', 'disconnected', 'disabled', UNIT)
    ]
    const text = mountUnit().text()
    expect(text).toContain('Connected to STH-A')
    expect(text).toContain('STU-1')
    expect(text).toContain('Reload STU')
    expect(text).toContain('Discover the sensor devices')
  })

  it('follows the sequence of the unit', () => {
    const wrapper = mountUnit()
    const states = () => wrapper.findAll('[data-test="unit-pipeline"] li[data-state]')
      .map(step => step.attributes('data-state'))
    expect(states()).toEqual(['done', 'current', 'upcoming', 'upcoming'])
  })

  it('disconnects its own network', async () => {
    const wrapper = mountUnit()
    const button = wrapper.findAll('button').find(b => b.text().includes('Disconnect'))
    await button?.trigger('click')
    expect(disconnectCAN).toHaveBeenCalledWith(UNIT)
  })
})
