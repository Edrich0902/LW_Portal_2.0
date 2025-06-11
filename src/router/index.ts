import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@views/auth/LoginView.vue'
import ForgotPasswordView from '@views/auth/ForgotPasswordView.vue'
import DashboardView from '@views/dashboard/DashboardView.vue'
import { useAuthStore } from '@stores/auth/auth.store.ts'
import { useToast } from 'primevue/usetoast'

const handleMeta = (showMenu: boolean, authed: boolean) => {
  return {
    showMenu: showMenu,
    authed: authed,
  }
}

// TODO: update router to use correct components
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Auth
    { path: '/', name: 'login', component: LoginView },
    { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPasswordView },

    // General
    { path: '/dashboard', name: 'Dashboard', component: DashboardView, meta: handleMeta(true, true) },
    { path: '/users', name: 'Users', component: ForgotPasswordView, meta: handleMeta(true, true) },
    { path: '/announcements', name: 'Announcements', component: ForgotPasswordView, meta: handleMeta(true, true) },

    // Content Management
    { path: '/sermons', name: 'Sermons', component: ForgotPasswordView, meta: handleMeta(true, true) },
    { path: '/vision-mission', name: 'VisionMission', component: ForgotPasswordView, meta: handleMeta(true, true) },
    { path: '/roleplayers', name: 'Roleplayers', component: ForgotPasswordView, meta: handleMeta(true, true) },
    { path: '/events', name: 'Events', component: ForgotPasswordView, meta: handleMeta(true, true) },
    { path: '/social-media', name: 'SocialMedia', component: ForgotPasswordView, meta: handleMeta(true, true) },
    { path: '/connect-serve', name: 'ConnectServe', component: ForgotPasswordView, meta: handleMeta(true, true) },

    // Profile
    { path: '/profile', name: 'Profile', component: ForgotPasswordView, meta: handleMeta(true, true) },
    { path: '/settings', name: 'Settings', component: ForgotPasswordView, meta: handleMeta(true, true) },
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
