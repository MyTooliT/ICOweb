import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import 'primeicons/primeicons.css';
import './styles/style.css';
import './styles/tailwind/tailwind-output.css';
import './styles/material-theme/light.css';
import './styles/material-theme/light-mc.css';
import './styles/material-theme/light-hc.css';
import './styles/material-theme/dark.css';
import './styles/material-theme/dark-mc.css';
import './styles/material-theme/dark-hc.css';
import router from './router';
import App from './App.vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import { myPreset } from '../primevue.ts';
import Ripple from 'primevue/ripple';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate)
const app = createApp(App)
app.use(pinia)
app.use(router)
app.directive('ripple', Ripple);
app.use(PrimeVue, {
  theme: {
    preset: myPreset
  },
  ripple: false
})
app.use(ToastService)
app.mount('#app')
