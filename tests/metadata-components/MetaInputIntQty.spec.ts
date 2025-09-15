/// <reference types="vitest" />
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import {nextTick} from 'vue'
import MetaInputIntQty from '@/components/elements/forms/meta/MetaInputIntQty.vue'
import {Quantity} from '@/client';
import InputNumber from 'primevue/inputnumber';

function mountDirect(
    initial: Quantity | undefined,
) {
    const wrapper = mount(MetaInputIntQty, {
        attachTo: document.body,
        props: {
            unit: 'mm/min',
            modelValue: initial as any,
            required: true
        }
    })

    const findNumberInput = () => wrapper.findComponent(InputNumber)

    return { wrapper, findNumberInput }
}

describe('MetaInputIntQty.vue — minimal emissions contract', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    it('initial state: undefined -> nothing happens (no emit on mount)', async () => {
        const { wrapper } = mountDirect(undefined)
        await nextTick()

        const calls = wrapper.emitted('update:modelValue')
        expect(calls).toBeUndefined() // no emission at all
    })

    it('initial state: valid Quantity -> emits it on mount', async () => {
        const initial: Quantity = { value: 7, unit: 'cm' }
        const { wrapper } = mountDirect(initial)
        await nextTick()

        const calls = wrapper.emitted('update:modelValue')
        expect(calls && calls.length).toBeGreaterThan(0)
        const firstPayload = calls![0][0] as Quantity
        expect(firstPayload).toEqual(initial)
    })

    it('typed input (digits) -> emits new Quantity with updated value', async () => {
        const initial: Quantity = { value: 0, unit: 'mm' }
        const { wrapper, findNumberInput } = mountDirect(initial)
        await nextTick()
        const before = (wrapper.emitted('update:modelValue') || []).length
        const input = findNumberInput()
        expect(input.exists()).toBe(true)
        input.vm.$emit('input', {value: 42})
        await nextTick()
        const calls = wrapper.emitted('update:modelValue') ?? []
        await nextTick()
        expect(calls.length).toBeGreaterThan(before)
        const lastPayload = calls[calls.length - 1][0] as Quantity
        expect(typeof lastPayload.value).toBe('number')
        expect(lastPayload.value).toBe(42)
        expect(lastPayload.unit).toBe('mm')
    })
})
