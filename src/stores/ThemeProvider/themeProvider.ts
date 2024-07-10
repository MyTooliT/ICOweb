import { defineStore } from 'pinia';
import { computed, type ComputedRef, type Ref, ref } from 'vue';

export enum ThemeStyle {
    Light = 'light',
    LightMediumContrast = 'light-medium-contrast',
    LightHighContrast = 'light-hight-contrast',
    Dark = 'dark',
    DarkMediumContrast = 'dark-medium-contrast',
    DarkHighContrast = 'dark-high-contrast',
}

export const useThemeProviderStore = defineStore('theme', () => {
    const _activeTheme: Ref<ThemeStyle> = ref<ThemeStyle>(ThemeStyle.Light);
    /* eslint-disable-next-line max-len */
    const getActiveTheme: ComputedRef<ThemeStyle> = computed(() => _activeTheme.value)
    function setActiveTheme(newTheme: ThemeStyle): Boolean {
        if(newTheme !== _activeTheme.value) {
            _activeTheme.value = newTheme    
            return true        
        }
        return false
    }

    return { getActiveTheme, setActiveTheme }
})