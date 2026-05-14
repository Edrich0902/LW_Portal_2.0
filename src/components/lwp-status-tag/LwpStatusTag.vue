<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: string | undefined
}>()

const statusConfig = computed(() => {
  const status = props.value?.toLowerCase()
  
  switch (status) {
    case 'sent':
    case 'complete':
    case 'ok':
    case 'active':
      return { severity: 'success' as const, icon: 'pi pi-check-circle', label: props.value }
    case 'pending':
    case 'loading':
    case 'warn':
      return { severity: 'warn' as const, icon: 'pi pi-clock', label: props.value }
    case 'error':
    case 'invalid':
    case 'danger':
    case 'deleted':
      return { severity: 'danger' as const, icon: 'pi pi-exclamation-triangle', label: props.value }
    case 'info':
    case 'uninitialized':
      return { severity: 'info' as const, icon: 'pi pi-info-circle', label: props.value }
    default:
      return { severity: 'secondary' as const, icon: 'pi pi-question-circle', label: props.value ?? 'Unknown' }
  }
})
</script>

<template>
  <Tag :severity="statusConfig.severity" :value="statusConfig.label" class="flex items-center gap-1">
    <template #icon>
      <i :class="[statusConfig.icon, 'text-[10px]']"></i>
    </template>
  </Tag>
</template>
