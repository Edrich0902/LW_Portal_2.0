import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ThemeMode } from '@/types/theme/theme.ts'

const STORAGE_KEY = 'lwp-theme-mode'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>((localStorage.getItem(STORAGE_KEY) as ThemeMode) ?? 'system')
  let mediaQuery: MediaQueryList | null = null

  function handleSystemChange(e: MediaQueryListEvent) {
    document.documentElement.classList.toggle('dark', e.matches)
  }

  function applyTheme() {
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', handleSystemChange)
      mediaQuery = null
    }

    if (mode.value === 'system') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      document.documentElement.classList.toggle('dark', mediaQuery.matches)
      mediaQuery.addEventListener('change', handleSystemChange)
    } else {
      document.documentElement.classList.toggle('dark', mode.value === 'dark')
    }
  }

  function setMode(newMode: ThemeMode) {
    mode.value = newMode
    localStorage.setItem(STORAGE_KEY, newMode)
    applyTheme()
  }

  return { mode, setMode, applyTheme }
})
