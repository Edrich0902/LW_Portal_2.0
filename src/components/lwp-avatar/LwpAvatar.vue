<script setup lang="ts">
import LwpImage from '@components/lwp-image/LwpImage.vue'
import { ref } from 'vue'
import type { User } from '@/types/user/user.ts'
import type { MenuItemCommandEvent } from 'primevue/menuitem'
import { useAuthStore } from '@stores/auth/auth.store.ts'
import { useConfirm } from 'primevue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  user?: User
}>()

const auth = useAuthStore()
const confirm = useConfirm()
const router = useRouter()

const menu = ref();

const items = ref([
  {
    label: 'Options',
    items: [
      {
        label: 'My Profile',
        icon: 'pi pi-user',
        command: async () => await router.push('/profile'),
      },
      {
        label: 'Settings',
        icon: 'pi pi-cog',
        command: async () => await router.push('/settings'),
      },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: async (event: MenuItemCommandEvent) => await handleSignOut(event),
      }
    ]
  }
]);

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

const toggle = (event: Event) => {
  menu.value.toggle(event);
};
</script>

<template>
  <Avatar class="cursor-pointer hover:opacity-75" shape="circle" size="large" aria-haspopup="true" aria-controls="overlay_menu" @click="toggle">
    <LwpImage :public-id="props.user?.profile_public_id" :height="250" :width="250" class-name="object-cover" />
  </Avatar>
  <Menu ref="menu" id="overlay_menu" :model="items" :popup="true" />
</template>
