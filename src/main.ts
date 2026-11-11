// Application imports
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import router from './router';
import App from './App.vue';

// Styles and theme import
import './styles/style.css';
import './styles/tailwind/tailwind-output.css';
import '@base/configuration/theme.css';

// PrimeVue Library import
import PrimeVue from 'primevue/config';
import { Ripple, Tooltip, ToastService } from 'primevue'
import { createPrimeVueOptions } from '@base/configuration/primevue.ts';
import { themes } from '@base/configuration/theme.ts';
import 'primeicons/primeicons.css';


// Application Setup
const themeKey = (import.meta.env.VITE_APPLICATION_THEME || 'blue') as keyof typeof themes;
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate)
const app = createApp(App)
app.use(pinia)
app.use(router)
app.directive('ripple', Ripple);
app.directive('tooltip', Tooltip);
app.use(PrimeVue, createPrimeVueOptions(themes[themeKey]))
app.use(ToastService)
app.mount('#app')
