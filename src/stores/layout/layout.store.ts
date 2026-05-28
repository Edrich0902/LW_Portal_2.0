import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'lwp-sidebar-visible'

export const useLayoutStore = defineStore('layout', () => {
  const sidebarVisible = ref<boolean>(localStorage.getItem(STORAGE_KEY) !== 'false')

  function toggleSidebar() {
    sidebarVisible.value = !sidebarVisible.value
    localStorage.setItem(STORAGE_KEY, String(sidebarVisible.value))
  }

  return { sidebarVisible, toggleSidebar }
})
