// Application imports
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import router from './router';
import App from './App.vue';

// Styles and theme import
import './styles/style.css';
import './styles/tailwind/tailwind-output.css';
import '@/styles/themes/blue.css';

// PrimeVue Library import
import PrimeVue from 'primevue/config';
import { Ripple, Tooltip, ToastService } from 'primevue'
import { bluePreset } from './styles/primevue.ts';
import 'primeicons/primeicons.css';


// Application Setup
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate)
const app = createApp(App)
app.use(pinia)
app.use(router)
app.directive('ripple', Ripple);
app.directive('tooltip', Tooltip);
app.use(PrimeVue, {
  theme: {
    preset: bluePreset,
    options: {
      darkModeSelector: '.app-dark'
    }
  },
  ripple: false
})
app.use(ToastService)
app.mount('#app')
