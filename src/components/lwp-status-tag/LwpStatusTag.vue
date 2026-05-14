<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: string | undefined
}>()

const statusConfig = computed(() => {
  const status = props.value?.toLowerCase()
  const originalValue = props.value ?? 'Unknown'

  // Standard formatting helper
  const formatLabel = (val: string) => val.charAt(0).toUpperCase() + val.slice(1).replace(/_/g, ' ')

  switch (status) {
    // States
    case 'sent':
    case 'complete':
    case 'ok':
    case 'active':
      return { severity: 'success' as const, icon: 'pi pi-check-circle', label: formatLabel(originalValue) }
    case 'pending':
    case 'loading':
    case 'warn':
      return { severity: 'warn' as const, icon: 'pi pi-clock', label: formatLabel(originalValue) }
    case 'error':
    case 'invalid':
    case 'danger':
    case 'deleted':
      return { severity: 'danger' as const, icon: 'pi pi-exclamation-triangle', label: formatLabel(originalValue) }

    // Event Categories
    case 'general':
      return { severity: 'info' as const, icon: 'pi pi-calendar', label: 'General' }
    case 'onceoff':
    case 'once':
      return { severity: 'warn' as const, icon: 'pi pi-star', label: 'Special Event' }
    case 'course':
      return { severity: 'primary' as const, icon: 'pi pi-book', label: 'Course' }

    // Event Types / Frequencies
    case 'weekly':
      return { severity: 'secondary' as const, icon: 'pi pi-replay', label: 'Weekly' }
    case 'monthly':
      return { severity: 'secondary' as const, icon: 'pi pi-calendar-plus', label: 'Monthly' }
    case 'daily':
      return { severity: 'secondary' as const, icon: 'pi pi-sun', label: 'Daily' }

    // Group Types
    case 'connect':
      return { severity: 'primary' as const, icon: 'pi pi-users', label: 'Connect Group' }
    case 'serve':
      return { severity: 'help' as const, icon: 'pi pi-heart', label: 'Serve Team' }

    // Social Media
    case 'instagram':
      return { severity: 'danger' as const, icon: 'pi pi-instagram', label: 'Instagram' }
    case 'facebook':
      return { severity: 'info' as const, icon: 'pi pi-facebook', label: 'Facebook' }
    case 'youtube':
      return { severity: 'danger' as const, icon: 'pi pi-youtube', label: 'YouTube' }
    case 'tiktok':
      return { severity: 'secondary' as const, icon: 'pi pi-video', label: 'TikTok' }

    default:
      return { severity: 'secondary' as const, icon: 'pi pi-tag', label: formatLabel(originalValue) }
  }
})
</script>

<template>
  <Tag :severity="statusConfig.severity" class="flex items-center gap-1.5 px-3 py-1">
    <template #icon>
      <i :class="[statusConfig.icon, 'text-[11px]']"></i>
    </template>
    <span class="text-[11px] font-bold uppercase tracking-wider">{{ statusConfig.label }}</span>
  </Tag>
</template>
