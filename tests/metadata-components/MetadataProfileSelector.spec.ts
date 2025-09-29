import { describe, it, expect, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import Select from 'primevue/select'
import { load } from 'js-yaml'
import MetadataProfileSelector from '@/components/forms/MetadataProfileSelector.vue'
import type { MetadataConfig } from '@/utils/metadataConfig.ts'
import yamlFile from '!@/metadata.yaml?raw'

let CONFIG: MetadataConfig

beforeAll(() => {
    CONFIG = load(yamlFile) as MetadataConfig
})

function mountWithParent(config: MetadataConfig = CONFIG, model: string|undefined = undefined, disabled = false) {
    const m = ref(model)
    const Parent = defineComponent({
        components: { MetadataProfileSelector },
        setup: () => () =>
            h(MetadataProfileSelector, {
                disabled,
                config: config,
                modelValue: m.value,
                'onUpdate:modelValue': (v: string|undefined) => (m.value = v),
            }),
    })
    const wrapper = mount(Parent, {
        attachTo: document.body,
        global: { components: { Select } },
    })
    return { wrapper, model: m, findSelectComponent: () => wrapper.findComponent(Select) }
}

describe('MetadataProfileSelector.vue with real PrimeVue + metadata.yaml', () => {
    it('renders header text "Metadata Profile"', () => {
        const { wrapper } = mountWithParent()
        expect(wrapper.text()).toMatch(/Metadata Profile/i)
    })

    it('passes YAML profiles into Select options', () => {
        const { findSelectComponent } = mountWithParent()
        const selectOptions = findSelectComponent().props('options') as any[]
        expect(selectOptions).toHaveLength(Object.keys(CONFIG.profiles).length)
    })

    it('reflects initial modelValue', async () => {
        const firstId = Object.values(CONFIG.profiles)[0].id
        const { model, findSelectComponent } = mountWithParent(CONFIG, firstId)
        await nextTick()
        expect(model.value).toBe(firstId)
        expect(findSelectComponent().props('modelValue')).toBe(firstId)
    })

    it('updates parent model when Select emits', async () => {
        const ids = Object.values(CONFIG.profiles).map(p => p.id)
        const target = ids.at(-1)
        const { model, findSelectComponent } = mountWithParent()
        findSelectComponent().vm.$emit('update:modelValue', target)
        await nextTick()
        expect(model.value).toBe(target)
    })

    it('reacts to `config` prop changes (options update from YAML-derived config)', async () => {
        const model = ref<string | undefined>(undefined)
        const wrapper = mount(MetadataProfileSelector, {
            attachTo: document.body,
            props: {
                disabled: false,
                config: CONFIG,
                modelValue: model.value,
                'onUpdate:modelValue': (v: string|undefined) => (model.value = v),
            },
            global: {
                components: { Select },
            },
        })

        // sanity: initial options mirror YAML
        const sel = wrapper.findComponent(Select)
        expect((sel.props('options') as any[]).length)
            .toBe(Object.keys(CONFIG.profiles).length)

        // update the config prop on the *mounted wrapper*
        const updated = structuredClone(CONFIG)
        updated.profiles['__added__'] = { id: '__added__', name: 'Added Profile', pre: {}, post: {} }

        await wrapper.setProps({ config: updated })
        await nextTick()

        const opts = (sel.props('options') as any[]).map(o => o.id)
        expect(opts).toContain('__added__')
    })
})
