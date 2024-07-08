import {it, expect, describe} from 'vitest'
import { mount } from '@vue/test-utils'

import SolidButton from './buttons/SolidButton.vue'
import OutlineButton from './buttons/OutlineButton.vue'
import { ButtonColors } from './buttons/types'

describe('Solid Button Component Test', ()=> {
    const btn = mount(SolidButton)
    const buttons: Array<typeof btn> = []
    ButtonColors.forEach(buttonColor => {
        buttons.push(mount(SolidButton, {
          props: {color: buttonColor, text: buttonColor}
        }))
    })

    buttons.forEach(button => {        
        it(`Solid button renders (${button.props().color})`, () => {
            expect(button.html().startsWith('<button')).toBeTruthy()
        })
        /* eslint-disable-next-line max-len */
        it(`Solid button contains color class (${button.props().color})`, () => {
            expect(button.classes().toString()).toContain(button.props().color)
        })
        it(`Solid button renders text (${button.props().color})`, () => {
            expect(button.text()).toBe(button.props().color)
        })
    })

    it('Disabled button renders', () => {
        const btn = mount(SolidButton, {props: {disabled: true}})
        expect(Object.keys(btn.attributes())).toContain('disabled')
    })
})

describe('Outline Button Component Test', ()=> {
  const btn = mount(OutlineButton)
  const buttons: Array<typeof btn> = []
  ButtonColors.forEach(buttonColor => {
    buttons.push(mount(OutlineButton, {
      props: {color: buttonColor, text: buttonColor}
    }))
  })

  buttons.forEach(button => {
    it(`Outline button renders (${button.props().color})`, () => {
      expect(button.html().startsWith('<button')).toBeTruthy()
    })
    it(`Outline button contains color class (${button.props().color})`, () => {
      expect(button.classes().toString()).toContain(button.props().color)
    })
    it(`Outline button renders text (${button.props().color})`, () => {
      expect(button.text()).toBe(button.props().color)
    })
  })

  it('Disabled button renders', () => {
    const btn = mount(OutlineButton, {props: {disabled: true}})
    expect(Object.keys(btn.attributes())).toContain('disabled')
  })
})