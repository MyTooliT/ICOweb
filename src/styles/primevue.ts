import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';
import { themes } from '../theme/theme.ts'
const themeKey: keyof typeof themes = import.meta.env.VITE_APPLICATION_THEME || 'blue';

export const themePreset = definePreset(Aura, {
  semantic: {
    primary: themes[themeKey]
  }
})