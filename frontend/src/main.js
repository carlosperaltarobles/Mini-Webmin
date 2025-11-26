/**
 * La Chanchona - Frontend Entry Point
 */

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

// Estilos globales
import './styles/main.scss'

const app = createApp(App)

app.use(router)
app.use(vuetify)

app.mount('#app')
