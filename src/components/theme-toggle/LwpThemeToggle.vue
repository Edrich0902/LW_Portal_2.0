<script setup lang="ts">
import { computed, ref } from 'vue'
import { useThemeStore } from '@stores/theme/theme.store.ts'
import type { ThemeMode } from '@/types/theme/theme.ts'

const themeStore = useThemeStore()
const popover = ref()

const options: Array<{ value: ThemeMode; icon: string; label: string }> = [
  { value: 'system', icon: 'pi pi-desktop', label: 'System' },
  { value: 'light', icon: 'pi pi-sun', label: 'Light' },
  { value: 'dark', icon: 'pi pi-moon', label: 'Dark' },
]

const currentIcon = computed(
  () => options.find((o) => o.value === themeStore.mode)?.icon ?? 'pi pi-desktop',
)

function select(value: ThemeMode) {
  themeStore.setMode(value)
  popover.value.hide()
}
</script>

<template>
  <Button
    :icon="currentIcon"
    severity="secondary"
    text
    rounded
    aria-label="Toggle theme"
    @click="popover.toggle($event)"
    class="shrink-0"
  />
  <Popover ref="popover">
    <div class="flex flex-col gap-0.5 min-w-36">
      <p class="text-xs text-surface-400 font-semibold uppercase px-2 pt-1 pb-2">Appearance</p>
      <button
        v-for="option in options"
        :key="option.value"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full text-left transition-colors cursor-pointer"
        :class="
          themeStore.mode === option.value
            ? 'bg-primary/10 text-primary font-semibold'
            : 'hover:bg-surface-100 dark:hover:bg-surface-800'
        "
        @click="select(option.value)"
      >
        <i :class="option.icon" class="text-sm" />
        {{ option.label }}
      </button>
    </div>
  </Popover>
</template>
