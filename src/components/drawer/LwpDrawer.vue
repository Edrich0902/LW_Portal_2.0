<script setup lang="ts">
  import { computed, ref } from 'vue'
  import type { MenuItem } from 'primevue/menuitem'
  import { useAuthStore } from '@stores/auth/auth.store.ts'
  import { useConfirm } from 'primevue'
  import { useRouter } from 'vue-router'

  const auth = useAuthStore()
  const confirm = useConfirm()
  const router = useRouter()

  const displayName = computed(() => {
    const p = auth.userProfile
    if (!p) return ''
    return [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email
  })

  const initials = computed(() => {
    const p = auth.userProfile
    if (!p) return '?'
    const letters = `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}` || p.email?.[0] || '?'
    return letters.toUpperCase()
  })

  const items = ref<Array<MenuItem>>([
    {
      label: 'General',
      items: [
        { label: 'Dashboard', to: '/dashboard', icon: 'pi pi-objects-column', },
        { label: 'Users', to: '/users', icon: 'pi pi-user', },
        { label: 'Roles', to: '/roles', icon: 'pi pi-id-card', },
        { label: 'Announcements', to: '/announcements', icon: 'pi pi-megaphone', },
      ]
    },
    {
      label: 'Content Management',
      items: [
        { label: 'Sermons', to: '/sermons', icon: 'pi pi-book' },
        { label: 'Vision & Mission', to: '/vision-mission', icon: 'pi pi-lightbulb' },
        { label: 'Roleplayers', to: '/roleplayers', icon: 'pi pi-users' },
        { label: 'Events', to: '/events', icon: 'pi pi-calendar' },
        { label: 'Event Overview', to: '/event-overview', icon: 'pi pi-chart-bar' },
        { label: 'Social Media', to: '/social-media', icon: 'pi pi-hashtag' },
        { label: 'Connect & Serve', to: '/connect-serve', icon: 'pi pi-users' },
        { label: 'Tithes & Offerings', to: '/tithes-offerings', icon: 'pi pi-wallet' },
        { label: 'Prayer Requests', to: '/prayer-requests', icon: 'pi pi-heart' },
        { label: 'App Feedback', to: '/app-feedback', icon: 'pi pi-comments' },
      ]
    }
  ])

  const handleSignOut = async (event: Event) => {
    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: 'Are you sure you want to logout?',
      icon: 'pi pi-info-circle',
      rejectProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptProps: {
        label: 'Logout',
        severity: 'danger',
      },
      accept: async () => {
        const success = await auth.signOut()
        if (success) await router.replace('/');
      },
      reject: () => {}
    })
  }
</script>

<template>
  <Menu :model="items" class="w-full h-full !rounded-2xl !shadow-xl">
    <!-- Brand / logo header -->
    <template #start>
      <div class="flex items-center gap-3 px-4 py-4">
        <img
          class="w-10 h-10 rounded-full ring-2 ring-primary-100 dark:ring-primary-900/40 shrink-0"
          src="@assets/images/lwp_icon.png"
          alt="LWP Logo"
        />
        <div class="flex flex-col leading-tight min-w-0 flex-1">
          <span class="text-base font-semibold text-surface-900 dark:text-surface-0">LWP Admin</span>
          <span class="text-xs text-surface-500 dark:text-surface-400">Portal</span>
        </div>
      </div>
    </template>

    <!-- Navigation items -->
    <template #item="{ item, props }">
      <router-link v-if="item.to" v-slot="{ href, navigate, isExactActive }" :to="item.to" custom>
        <a
          v-ripple
          :href="href"
          v-bind="props.action"
          :class="{ 'nav-item--active': isExactActive }"
          @click="navigate"
        >
          <span :class="item.icon" class="w-5 text-center text-base shrink-0" />
          <span class="nav-label">{{ item.label }}</span>
        </a>
      </router-link>
      <a v-else v-ripple :href="item.url" :target="item.target" v-bind="props.action">
        <span :class="item.icon" class="w-5 text-center text-base shrink-0" />
        <span class="nav-label">{{ item.label }}</span>
      </a>
    </template>

    <!-- Account footer -->
    <template #end>
      <div class="p-3">
        <div class="flex items-center gap-3">
          <LwpImage
            v-if="auth.userProfile?.profile_public_id"
            :public-id="auth.userProfile.profile_public_id"
            :width="80"
            :height="80"
            class-name="w-10 h-10 rounded-full shrink-0"
          />
          <div
            v-else
            class="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-sm font-semibold shrink-0"
          >
            {{ initials }}
          </div>

          <div class="flex flex-col leading-tight min-w-0 flex-1">
            <span class="text-sm font-medium text-surface-900 dark:text-surface-0 truncate">{{ displayName }}</span>
            <span class="text-xs text-surface-500 dark:text-surface-400 truncate">{{ auth.userProfile?.email }}</span>
          </div>

          <button
            v-tooltip.top="'Logout'"
            type="button"
            class="flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer text-surface-500 dark:text-surface-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0"
            @click="handleSignOut"
          >
            <span class="pi pi-sign-out" />
          </button>
        </div>
      </div>
    </template>
  </Menu>
</template>
