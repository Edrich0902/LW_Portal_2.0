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
        { label: 'Dashboard', command: () => router.push('/dashboard'), icon: 'pi pi-objects-column', },
        { label: 'Users', command: () => router.push('/users'), icon: 'pi pi-user', },
        { label: 'Announcements', command: () => router.push('/announcements'), icon: 'pi pi-megaphone', },
      ]
    },
    {
      label: 'Content Management',
      items: [
        { label: 'Sermons', command: () => router.push('/sermons'), icon: 'pi pi-book' },
        { label: 'Vision & Mission', command: () => router.push('/vision-mission'), icon: 'pi pi-lightbulb' },
        { label: 'Roleplayers', command: () => router.push('/roleplayers'), icon: 'pi pi-users' },
        { label: 'Events', command: () => router.push('/events'), icon: 'pi pi-calendar' },
        { label: 'Social Media', command: () => router.push('/social-media'), icon: 'pi pi-hashtag' },
        { label: 'Connect & Serve', command: () => router.push('/connect-serve'), icon: 'pi pi-users' },
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
  <Menu :model="items" class="w-56 h-dvh !rounded-tr-4xl !rounded-br-4xl">
    <template #start>
      <span class="inline-flex items-center gap-1 px-2 py-2">
        <img class="w-10 h-10 mr-4 rounded-full" src="@assets/images/lwp_icon.png" alt="LWP Logo" />
        <span class="text-xl font-semibold">LWP Admin</span>
      </span>
    </template>
  </Menu>
</template>
