<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import LwpDrawer from '@components/drawer/LwpDrawer.vue'

const route = useRoute()
</script>

<template>
  <!-- PRIMEVUE TOAST PROVIDER -->
  <Toast />
  <!-- CONFIRMATION POPUP PROVIDER -->
  <ConfirmPopup />

  <div class="flex flex-row items-stretch gap-x-2">
    <LwpDrawer v-if="route.meta.showMenu"/>
    <RouterView class="overflow-auto h-dvh"/>
  </div>
</template>
