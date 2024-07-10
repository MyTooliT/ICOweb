import { createApp } from 'vue';
import { createPinia } from 'pinia';
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

const pinia = createPinia();
const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')
