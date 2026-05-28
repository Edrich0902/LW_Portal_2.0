<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import LwpDrawer from '@components/drawer/LwpDrawer.vue'
import { useLayoutStore } from '@stores/layout/layout.store.ts'

const route = useRoute()
const layout = useLayoutStore()
</script>

<template>
  <!-- PRIMEVUE TOAST PROVIDER -->
  <Toast />
  <!-- CONFIRMATION POPUP PROVIDER -->
  <ConfirmPopup />

  <div class="flex flex-row items-stretch h-screen p-3 overflow-hidden bg-surface-50 dark:bg-surface-950">
    <!-- Floating, sliding sidebar -->
    <div
      v-if="route.meta.showMenu"
      class="w-64 h-full shrink-0 transition-[margin,transform] duration-300 ease-in-out"
      :class="layout.sidebarVisible ? 'ml-0 mr-3 translate-x-0' : '-ml-64 mr-0 -translate-x-10'"
    >
      <LwpDrawer />
    </div>
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" class="overflow-auto flex flex-col flex-1 min-w-0" />
      </Transition>
    </RouterView>
  </div>
</template>
