import './assets/main.css'
import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import App from './App.vue'
import router from './router'
import { ConfirmationService, ToastService } from 'primevue'
import { useAuthStore } from '@stores/auth/auth.store.ts'
import { pinia } from '@stores/pinia.store.ts'

const app = createApp(App)

// App Configuration
app.use(PrimeVue, {
    ripple: true,
    theme: {
      preset: {
        ...Aura,
        semantic: {
          ...Aura.semantic,
          primary: {
            50: '{sky.50}',
            100: '{sky.100}',
            200: '{sky.200}',
            300: '{sky.300}',
            400: '{sky.400}',
            500: '{sky.500}',
            600: '{sky.600}',
            700: '{sky.700}',
            800: '{sky.800}',
            900: '{sky.900}',
            950: '{sky.950}'
          }
        }
      },
      options: {
        darkModeSelector: 'system',
      },
    },
  })
  .use(ToastService)
  .use(ConfirmationService)

// State management
app.use(pinia)

// Initialise auth
const authStore = useAuthStore()
await authStore.initialise()

// Routing management
app.use(router)

app.mount('#app')
