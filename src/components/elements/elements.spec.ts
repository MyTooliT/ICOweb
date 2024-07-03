import {it, expect, describe, beforeAll} from 'vitest'
import { mount } from '@vue/test-utils'

import SolidButton from './buttons/SolidButton.vue'
import { ButtonColors } from "./buttons/types"

describe('Solid Button Component Test', ()=> {
    const btn = mount(SolidButton)
    const buttons: Array<typeof btn> = []
    ButtonColors.forEach(buttonColor => {
        buttons.push(mount(SolidButton, {props: {color: buttonColor, text: buttonColor}}))
    })

    buttons.forEach(button => {        
        it(`Solid button renders (${button.props().color})`, () => {
            expect(button.html().startsWith('<button')).toBeTruthy()
        })
        it(`Solid button contains color class (${button.props().color})`, () => {
            expect(button.classes().toString()).toContain(button.props().color)
        })
        it(`Solid button renders text (${button.props().color})`, () => {
            expect(button.text()).toBe(button.props().color)
        })
    })

    it('Disabled button renders', () => {
        const btn = mount(SolidButton, {props: {disabled: true}})
        expect(Object.keys(btn.attributes())).toContain("disabled")
    })
})