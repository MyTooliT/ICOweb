import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import HardwareStep from '@/components/misc/HardwareStep.vue'

function mountStep(props: Record<string, unknown>) {
  return mount(HardwareStep, {
    props: {
      step: 2,
      state: 'current',
      title: 'The title',
      status: 'Loaded',
      ...props
    },
    slots: {
      default: '<p>content</p>',
      actions: '<button>act</button>'
    }
  })
}

describe('HardwareStep', () => {
  it('shows the step number, title, actions and content', () => {
    const wrapper = mountStep({})
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('The title')
    expect(wrapper.text()).toContain('Loaded')
    expect(wrapper.text()).toContain('act')
    expect(wrapper.text()).toContain('content')
  })

  it('shows a check mark instead of the number once done', () => {
    const wrapper = mountStep({ state: 'done' })
    expect(wrapper.find('.pi-check').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('2')
  })

  it('replaces body and actions by the message while locked', () => {
    const wrapper = mountStep({ locked: true, lockedMessage: 'Do 1 first' })
    expect(wrapper.attributes('inert')).toBeDefined()
    expect(wrapper.text()).toContain('Do 1 first')
    expect(wrapper.text()).not.toContain('content')
    expect(wrapper.text()).not.toContain('act')
    expect(mountStep({}).attributes('inert')).toBeUndefined()
  })
})
