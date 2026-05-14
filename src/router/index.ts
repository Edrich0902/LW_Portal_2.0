import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@stores/auth/auth.store.ts'
import { useToast } from 'primevue/usetoast'

// VIEWS
import LoginView from '@views/auth/LoginView.vue'
import ForgotPasswordView from '@views/auth/ForgotPasswordView.vue'
import DashboardView from '@views/dashboard/DashboardView.vue'
import UsersView from '@views/users/UsersView.vue'
import AnnouncementsView from '@views/announcements/AnnouncementsView.vue'
import SermonsView from '@views/sermons/SermonsView.vue'
import RoleplayersView from '@views/roleplayers/RoleplayersView.vue'
import EventsView from '@views/events/EventsView.vue'
import SocialMediaView from '@views/social-media/SocialMediaView.vue'
import ConnectServeView from '@views/connect-serve/ConnectServeView.vue'
import VisionMissionView from '@views/vision-mission/VisionMissionView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    showMenu: boolean
    authed: boolean
    title: string
  }
}

const handleMeta = (showMenu: boolean, authed: boolean, title: string) => {
  return {
    showMenu: showMenu,
    authed: authed,
    title: title,
  }
}

// TODO: update router to use correct components
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Auth
    { path: '/', name: 'login', component: LoginView, meta: handleMeta(false, false, 'Login') },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: ForgotPasswordView,
      meta: handleMeta(false, false, 'Forgot Password'),
    },

    // General
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: DashboardView,
      meta: handleMeta(true, true, 'Dashboard'),
    },
    {
      path: '/users',
      name: 'Users',
      component: UsersView,
      meta: handleMeta(true, true, 'User Management'),
    },
    {
      path: '/announcements',
      name: 'Announcements',
      component: AnnouncementsView,
      meta: handleMeta(true, true, 'Announcements'),
    },

    // Content Management
    {
      path: '/sermons',
      name: 'Sermons',
      component: SermonsView,
      meta: handleMeta(true, true, 'Sermons'),
    },
    {
      path: '/vision-mission',
      name: 'VisionMission',
      component: VisionMissionView,
      meta: handleMeta(true, true, 'Vision & Mission'),
    },
    {
      path: '/roleplayers',
      name: 'Roleplayers',
      component: RoleplayersView,
      meta: handleMeta(true, true, 'Roleplayers'),
    },
    {
      path: '/events',
      name: 'Events',
      component: EventsView,
      meta: handleMeta(true, true, 'Events'),
    },
    {
      path: '/social-media',
      name: 'SocialMedia',
      component: SocialMediaView,
      meta: handleMeta(true, true, 'Social Media'),
    },
    {
      path: '/connect-serve',
      name: 'ConnectServe',
      component: ConnectServeView,
      meta: handleMeta(true, true, 'Connect & Serve'),
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const toast = useToast()

  // Update title
  const baseTitle = 'LW Portal'
  document.title = to.meta.title ? `${baseTitle} | ${to.meta.title}` : baseTitle

  if (!auth.authed && to.meta.authed) {
    toast.add({
      severity: 'warn',
      summary: 'Unauthenticated',
      detail: 'Login to access the system',
      life: 2000,
    })
    return { name: 'login' }
  }
})

export default router
