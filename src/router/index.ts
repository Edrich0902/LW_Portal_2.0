import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@views/auth/LoginView.vue'
import ForgotPassword from '@views/auth/ForgotPassword.vue'
import { useAuthStore } from '@stores/auth/auth.store.ts'
import { useToast } from 'primevue/usetoast'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: ForgotPassword,
      meta: {
        showMenu: true,
        authed: true, // just for testing - use this on actual authed routes
      }
    }
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const toast = useToast()
  if (!auth.authed && to.meta.authed) {
    toast.add({severity: 'warn', summary: 'Unauthenticated', detail: 'Login to access the system', life: 2000})
    return { name: 'login' }
  }
})

export default router
