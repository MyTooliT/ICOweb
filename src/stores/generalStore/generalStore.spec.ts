import {
    createPinia,
    setActivePinia
} from 'pinia';
import {
    beforeEach,
    describe,
    expect,
    it
} from 'vitest';
import { mount } from '@vue/test-utils';
import {
    ThemeStyle,
    useGeneralStore
} from './generalStore.ts';
import ThemeProvider from '../../components/elements/misc/ThemeProvider.vue';

describe('generalStore Component Unit Test', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    })

    it('generalStore Component does mount', () => {
        const wrapper = mount(ThemeProvider)
        expect(wrapper.exists()).toBe(true)
    })

    it('generalStore Component has only one class', () => {
        const wrapper = mount(ThemeProvider)
        expect(wrapper.classes().length).toBe(1)
    })
})

describe('Theme Provider Functionality', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('Light is default theme', () => {
        const themeProviderStore = useGeneralStore();
        const wrapper = mount(ThemeProvider)
        expect(themeProviderStore.getActiveTheme).toBe(ThemeStyle.Light)
        expect(wrapper.classes()[0]).toBe(ThemeStyle.Light)
    });

    it('Switch theme to dark', async () => {
        const themeProviderStore = useGeneralStore();
        const wrapper = mount(ThemeProvider)   
        // Note: Even though themeProviderStore.setActiveTheme is not async,
        //       async is required to test for reactivity it seems.
        await themeProviderStore.setActiveTheme(ThemeStyle.Dark)
        expect(themeProviderStore.getActiveTheme).toBe(ThemeStyle.Dark)
        expect(wrapper.classes()[0]).toBe(ThemeStyle.Dark)
    });

    it('Double switching is prohibited', () => {
        const themeProviderStore = useGeneralStore();
        expect(themeProviderStore.getActiveTheme).toBe(ThemeStyle.Light)
        expect(themeProviderStore.setActiveTheme(ThemeStyle.Dark)).toBe(true);
        expect(themeProviderStore.setActiveTheme(ThemeStyle.Dark)).toBe(false);
    });

    it('6 theme styles enum entries exist', () => {
        expect(Object.keys(ThemeStyle).length).toBe(6)
    })
})
    