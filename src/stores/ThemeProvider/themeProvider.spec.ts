import { setActivePinia, createPinia } from "pinia";
import { it, expect, describe, beforeEach, test } from 'vitest'
import { mount } from "@vue/test-utils"
import { useThemeProviderStore, ThemeStyle } from './themeProvider'
import ThemeProvider from "./ThemeProvider.vue";

describe('ThemeProvider Component Unit Test', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    })

    it('ThemeProvider Component does mount', () => {
        const wrapper = mount(ThemeProvider)
        expect(wrapper.exists()).toBe(true)
    })

    it('ThemeProvider Component has only one class', () => {
        const wrapper = mount(ThemeProvider)
        expect(wrapper.classes().length).toBe(1)
    })
})

describe('Theme Provider Functionality', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('Light is default theme', () => {
        const themeProviderStore = useThemeProviderStore();
        const wrapper = mount(ThemeProvider)
        expect(themeProviderStore.getActiveTheme).toBe(ThemeStyle.Light)
        expect(wrapper.classes()[0]).toBe(ThemeStyle.Light)
    });

    test('Switch theme to dark', async () => {
        const themeProviderStore = useThemeProviderStore();  
        const wrapper = mount(ThemeProvider)   
        // Note: Even though themeProviderStore.setActiveTheme is not async, async is 
        //       required to test for reactivity it seems.
        await themeProviderStore.setActiveTheme(ThemeStyle.Dark)
        expect(themeProviderStore.getActiveTheme).toBe(ThemeStyle.Dark)
        expect(wrapper.classes()[0]).toBe(ThemeStyle.Dark)
    });

    it('Double switching is prohibited', () => {
        const themeProviderStore = useThemeProviderStore();        
        expect(themeProviderStore.getActiveTheme).toBe(ThemeStyle.Light)
        expect(themeProviderStore.setActiveTheme(ThemeStyle.Dark)).toBe(true);
        expect(themeProviderStore.setActiveTheme(ThemeStyle.Dark)).toBe(false);
    });

    it('6 theme styles enum entries exist', () => {
        expect(Object.keys(ThemeStyle).length).toBe(6)
    })
})
    