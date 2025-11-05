import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';

export const bluePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#cce0eb',
      200: '#99c1d6',
      300: '#66a3c2',
      400: '#3384ad',
      450: '#1a74a3',
      500: '#006599',
      550: '#005b8a',
      600: '#00517a',
      700: '#003d5c',
      800: '#00283d',
      950: '#00141f',
    }
  }
})