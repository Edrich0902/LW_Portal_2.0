import './assets/main.css'
import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import App from './App.vue'
import router from './router'
import { ConfirmationService, Ripple, ToastService } from 'primevue'
import Tooltip from 'primevue/tooltip'
import { useAuthStore } from '@stores/auth/auth.store.ts'
import { useThemeStore } from '@stores/theme/theme.store.ts'
import { pinia } from '@stores/pinia.store.ts'

// Capture initial URL parameters before Supabase client consumes/clears them
if (typeof window !== 'undefined') {
  (window as any)._initialHref = window.location.href;
  (window as any)._initialSearch = window.location.search;
  (window as any)._initialHash = window.location.hash;
}

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
        darkModeSelector: '.dark',
      },
    },
  })
  .use(ToastService)
  .use(ConfirmationService)
  .directive('ripple', Ripple)
  .directive('tooltip', Tooltip)

// State management
app.use(pinia)

// Apply persisted theme before first render
const themeStore = useThemeStore()
themeStore.applyTheme()

// Initialise auth
const authStore = useAuthStore()
await authStore.initialise()

// Routing management
app.use(router)

app.mount('#app')
