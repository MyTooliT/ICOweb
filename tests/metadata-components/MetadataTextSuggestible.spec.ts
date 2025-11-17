/// <reference types="vitest" />
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import AutoComplete from 'primevue/autocomplete'
import MetaTextSuggestable from '@/components/forms/meta/MetaTextSuggestable.vue'

const DEFAULT_OPTIONS = ['Apple', 'banana', 'Apricot', 'grape', 'Pineapple']

function mountWithParent(initialModel: string|undefined = undefined, options = DEFAULT_OPTIONS) {
    const model = ref<string|undefined>(initialModel)
    const Parent = defineComponent({
        components: { MetaTextSuggestable },
        setup() {
            return () =>
                h(MetaTextSuggestable, {
                    options,
                    modelValue: model.value,
                    'onUpdate:modelValue': (v: string|undefined) => (model.value = v),
                })
        },
    })

    const wrapper = mount(Parent, {
        attachTo: document.body,
    })

    const findSelf = () => wrapper.findComponent(MetaTextSuggestable)
    const findAC = () => wrapper.findComponent(AutoComplete)

    return { wrapper, model, findSelf, findAC }
}

describe('MetaTextSuggestable.vue (real PrimeVue AutoComplete)', () => {
    beforeEach(() => {
        // jsdom sometimes keeps portals; ensure clean DOM
        document.body.innerHTML = ''
    })

    it('renders PrimeVue AutoComplete', () => {
        const { findAC } = mountWithParent()
        expect(findAC().exists()).toBe(true)
    })

    it('empty query returns all options (suggestions = options)', async () => {
        const options = DEFAULT_OPTIONS
        const { findAC } = mountWithParent(undefined, options)

        findAC().vm.$emit('complete', { query: '' })
        await nextTick()

        const suggestions = findAC().props('suggestions') as string[]
        expect(suggestions).toEqual(options)
    })

    it('filters case-insensitively by substring', async () => {
        const { findAC } = mountWithParent()

        findAC().vm.$emit('complete', { query: 'ap' })
        await nextTick()
        let suggestions = findAC().props('suggestions') as string[]
        expect(suggestions.sort()).toEqual(['Apple', 'Apricot', 'grape', 'Pineapple'].sort())

        findAC().vm.$emit('complete', { query: 'NA' })
        await nextTick()
        suggestions = findAC().props('suggestions') as string[]
        expect(suggestions).toEqual(['banana'])
    })

    it('v-model: child update bubbles to parent model', async () => {
        const { model, findAC } = mountWithParent(undefined)

        findAC().vm.$emit('update:modelValue', 'Hello World')
        await nextTick()

        expect(model.value).toBe('Hello World')
        expect(findAC().props('modelValue')).toBe('Hello World')
    })

    it('v-model: parent initial value reflects in AutoComplete', async () => {
        const { model, findAC } = mountWithParent('init value')
        await nextTick()
        expect(model.value).toBe('init value')
        expect(findAC().props('modelValue')).toBe('init value')
    })


    it('reacts when `options` prop changes (next complete uses new list)', async () => {
        const model = ref<string | undefined>(undefined)

        const wrapper = mount(MetaTextSuggestable, {
            attachTo: document.body,
            props: {
                options: ['one', 'two'],
                modelValue: model.value,
                'onUpdate:modelValue': (v: string|undefined) => (model.value = v),
            },
            global: { components: { AutoComplete } }, // real PrimeVue
        })

        const ac = wrapper.findComponent(AutoComplete)

        ac.vm.$emit('complete', { query: '' })
        await nextTick()
        expect(ac.props('suggestions')).toEqual(['one', 'two'])

        await wrapper.setProps({ options: ['alpha', 'beta', 'alphabet'] })
        await nextTick()

        ac.vm.$emit('complete', { query: 'alp' })
        await nextTick()
        expect((ac.props('suggestions') as string[]).sort()).toEqual(['alpha', 'alphabet'].sort())

        wrapper.unmount()
    })

    it('does not mutate the `options` prop during searches', async () => {
        const options = DEFAULT_OPTIONS
        const { findAC } = mountWithParent(undefined, options)

        findAC().vm.$emit('complete', { query: 'ap' })
        await nextTick()

        expect(options).toEqual(DEFAULT_OPTIONS)
    })
})
