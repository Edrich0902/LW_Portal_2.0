<script setup lang="ts">
import { useAuthStore } from '@stores/auth/auth.store.ts'
import { useLayoutStore } from '@stores/layout/layout.store.ts'
import LwpAvatar from '@components/lwp-avatar/LwpAvatar.vue'
import LwpThemeToggle from '@components/theme-toggle/LwpThemeToggle.vue'

defineProps<{
  showToolbar?: boolean
  title?: string
}>()

const auth = useAuthStore()
const layout = useLayoutStore()
</script>

<template>
  <div class="w-full p-4 flex flex-col gap-y-2 flex-1">
    <div v-if="showToolbar" class="w-full flex flex-row justify-between items-center">
      <div class="flex items-center gap-3 min-w-0">
        <button
          v-tooltip.bottom="layout.sidebarVisible ? 'Hide menu' : 'Show menu'"
          type="button"
          class="flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors shrink-0"
          @click="layout.toggleSidebar()"
        >
          <span class="pi pi-bars text-lg" />
        </button>
        <div class="text-2xl font-bold tracking-tight truncate">{{ title ?? '' }}</div>
      </div>
      <div class="flex flex-row items-center gap-x-2">
        <slot name="search" />
        <LwpThemeToggle />
        <LwpAvatar v-if="auth.userProfile" :user="auth.userProfile" />
      </div>
    </div>
    <slot></slot>
  </div>
</template>
