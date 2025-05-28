<script setup lang="ts">
  import { ref } from 'vue'
  import type { MenuItem, MenuItemCommandEvent } from 'primevue/menuitem'
  import { useAuthStore } from '@stores/auth/auth.store.ts'
  import { useConfirm } from 'primevue'
  import { useRouter } from 'vue-router'

  const auth = useAuthStore()
  const confirm = useConfirm()
  const router = useRouter()

  const items = ref<Array<MenuItem>>([
    { separator: true },
    {
      label: 'General',
      items: [
        { label: 'Dashboard', url: '/dashboard', icon: 'pi pi-objects-column', },
        { label: 'Users', url: '/users', icon: 'pi pi-user', },
        { label: 'Announcements', url: '/announcements', icon: 'pi pi-megaphone', },
      ]
    },
    {
      label: 'Content Management',
      items: [
        { label: 'Sermons', url: '/sermons', icon: 'pi pi-book' },
        { label: 'Vision & Mission', url: '/vision-mission', icon: 'pi pi-lightbulb' },
        { label: 'Roleplayers', url: '/roleplayers', icon: 'pi pi-users' },
        { label: 'Events', url: '/events', icon: 'pi pi-calendar' },
        { label: 'Social Media', url: '/social-media', icon: 'pi pi-hashtag' },
        { label: 'Connect & Serve', url: '/connect-serve', icon: 'pi pi-users' },
      ]
    },
    {
      label: 'Profile',
      items: [
        {
          label: 'Logout',
          command: async (event: MenuItemCommandEvent) => await handleSignOut(event),
          icon: 'pi pi-sign-out'
        },
      ]
    }
  ])

  const handleSignOut = async (event: MenuItemCommandEvent) => {
    confirm.require({
      target: event.originalEvent.currentTarget as HTMLElement,
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
  <Menu
    :model="items"
    class="w-56 h-dvh !rounded-xl" />
</template>
