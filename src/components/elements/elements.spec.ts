import {
  beforeEach,
  describe,
  expect,
  it
} from 'vitest';
import { mount } from '@vue/test-utils';

import SolidButton from './buttons/SolidButton.vue';
import OutlineButton from './buttons/OutlineButton.vue';
import EditableInput from './inputs/EditableInput.vue';
import { ButtonColors } from './buttons/types';

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



describe('Editable Input Component Test', () => {
  function mockSave(): Promise<void> {
    return Promise.resolve()
  }
  let inputWrapper = mount(EditableInput);
  beforeEach(() => {
    inputWrapper = mount(EditableInput, {
      props: {
        id: 'input-id',
        placeholder: 'Enter value...',
        disabled: false,
        regex: /^[a-zA-Z0-9]+$/,
        initialValue: 'Initial Value',
        saveFn: mockSave
      }
    });
  })

  it('EditableInput mounts', () => {
    expect(inputWrapper.element).toBeTruthy();
  });

  it('EditableInput renders provided value', () => {
    expect(inputWrapper.find('input').element.value).toBe('Initial Value');
  });

  it('EditableInput is disabled when the disabled prop is true', () => {
    const inputWrapperWithDisabled = mount(EditableInput, {
      props: {
        id: 'input-id',
        placeholder: 'Enter value...',
        disabled: true,
        regex: /^[a-zA-Z0-9]+$/,
        initialValue: 'Initial Value',
        saveFn: mockSave
      }
    });
    expect(inputWrapperWithDisabled.find('input').element.disabled)
      .toBeTruthy();
  });

  it('EditableInput accepts new Input', async () => {
    const newValue = 'New Value';
    const inputWrapperWithValue = mount(EditableInput, {
      props: {
        id: 'input-id',
        placeholder: 'Enter value...',
        disabled: true,
        regex: /^[a-zA-Z0-9]+$/,
        initialValue: 'Initial Value',
        saveFn: mockSave
      }
    });
    expect(inputWrapperWithValue.html().includes('data-state="readyToEdit"'))
      .toBe(true)
    await inputWrapperWithValue.find('button').trigger('click');
    await inputWrapperWithValue.vm.$nextTick();
    expect(inputWrapperWithValue.html().includes('data-state="editing"'))
      .toBe(true)
    await inputWrapperWithValue.find('input').setValue(newValue);
    expect(inputWrapperWithValue.html().includes('data-state="editing"'))
      .toBe(true)
    await inputWrapperWithValue.find('button').trigger('click');
    await inputWrapperWithValue.trigger('input')
    await inputWrapperWithValue.vm.$nextTick();
    expect(inputWrapperWithValue.find('input').element.value).toEqual(newValue);
  });
});