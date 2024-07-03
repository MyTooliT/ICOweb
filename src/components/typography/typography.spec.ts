import {it, expect, describe} from 'vitest'
import { mount } from '@vue/test-utils'

import Typography from './Typography.vue'
import { HeadingVariants } from '@/types/types';

describe('Typography Rendering Tests', () => {
    const wrapper = mount(Typography);

    it('Wrapper was mounted', () => {
        expect(wrapper.html().startsWith('<div')).toBeTruthy
    })

    HeadingVariants.forEach(variant => {
        it(`${variant} renders content`, () => {
            expect(wrapper.find(variant).text()).toBe(`Heading ${variant[1]}`)
        })
    })

    it('Body Components Render Content', () => {
        expect(wrapper.find('p').text().length).toBeGreaterThan(0)
        expect(wrapper.find('span').text().length).toBeGreaterThan(0)
    }) 
})