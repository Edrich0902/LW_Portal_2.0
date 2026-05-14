<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900/20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
    <div class="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-4">
      <i :class="[icon ?? 'pi pi-inbox', 'text-3xl text-primary-500']"></i>
    </div>
    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">{{ title }}</h3>
    <p v-if="description" class="text-gray-500 dark:text-gray-400 max-w-sm">
      {{ description }}
    </p>
    <div class="mt-6">
      <slot name="action"></slot>
    </div>
  </div>
</template>
