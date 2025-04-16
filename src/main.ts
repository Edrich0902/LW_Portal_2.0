import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// State management
app.use(createPinia())

// Routing configuration
app.use(router)

// Theme configuration
app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: 'system',
    },
  },
})

app.mount('#app')
