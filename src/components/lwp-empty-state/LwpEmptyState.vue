<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: string
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)
</script>

<template>
  <div
    class="flex flex-col items-center justify-center text-center bg-surface-50 dark:bg-surface-900/40 rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-700"
    :class="compact ? 'p-6' : 'p-8'"
  >
    <div
      class="rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center"
      :class="compact ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4'"
    >
      <i
        :class="[icon ?? 'pi pi-inbox', 'text-primary-500', compact ? 'text-2xl' : 'text-3xl']"
      ></i>
    </div>
    <h3
      class="font-semibold text-surface-900 dark:text-surface-0 mb-2"
      :class="compact ? 'text-base' : 'text-xl'"
    >
      {{ title }}
    </h3>
    <p v-if="description" class="text-surface-500 dark:text-surface-400 max-w-sm" :class="compact ? 'text-sm' : ''">
      {{ description }}
    </p>
    <div v-if="$slots.action" :class="compact ? 'mt-4' : 'mt-6'">
      <slot name="action"></slot>
    </div>
  </div>
</template>
