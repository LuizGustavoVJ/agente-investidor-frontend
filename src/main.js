import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import './style.css'
import App from './App.vue'
import router from './router/index.js'

// Configuração do Toast
const toastOptions = {
  position: 'top-right',
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
}

const app = createApp(App)

// Configurar Pinia para gerenciamento de estado
const pinia = createPinia()
app.use(pinia)

// Configurar Vue Router
app.use(router)

// Configurar Toast para notificações
app.use(Toast, toastOptions)

// Configurações globais
app.config.globalProperties.$APP_NAME = 'Agente Investidor'
app.config.globalProperties.$APP_VERSION = '1.0.0'

// Montar aplicação
app.mount('#app')

