<script setup lang="ts">
//import { useAuthStore } from '@stores/auth/auth.store.ts' // TODO: use authStore to get user image and show profile

defineProps<{ showToolbar?: boolean }>()

//const auth = useAuthStore(); // TODO: use authStore to get user image and show profile

</script>

<template>
  <div class="w-full h-dvh p-4">
    <div v-if="showToolbar" class="w-full flex flex-row justify-end">
      <div>Profile menu here</div>
    </div>
    <slot></slot>
  </div>
</template>
