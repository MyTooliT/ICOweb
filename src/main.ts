import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/style.css'
import './styles/tailwind-output.css'
import App from './App.vue'

const pinia = createPinia();
const app = createApp(App)
app.use(pinia)
app.mount('#app')
