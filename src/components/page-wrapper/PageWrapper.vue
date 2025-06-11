<script setup lang="ts">
import { useAuthStore } from '@stores/auth/auth.store.ts'
import LwpAvatar from '@components/lwp-avatar/LwpAvatar.vue'

defineProps<{
  showToolbar?: boolean,
  title?: string
}>()

const auth = useAuthStore()
</script>

<template>
  <div class="w-full h-dvh p-4 flex flex-col gap-y-2">
    <div v-if="showToolbar" class="w-full flex flex-row justify-between items-center">
      <div class="text-lg">{{ title ?? '' }}</div>
      <LwpAvatar v-if="auth.userProfile" :user="auth.userProfile" />
    </div>
    <div class="grow">
      <slot></slot>
    </div>
  </div>
</template>
