<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Status } from '@/types/status.ts'
import {
  FeedbackCategory,
  FeedbackStatus,
  feedbackCategoryLabels,
  feedbackStatusLabels,
  type AppFeedback,
} from '@/types/app-feedback/app-feedback.ts'
import { useAppFeedbackStore } from '@stores/app-feedback/app-feedback.store.ts'

const store = useAppFeedbackStore()

const props = defineProps<{
  visible: boolean
  feedback?: AppFeedback
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close', value: boolean): void
}>()

const model = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
})

const selectedStatus = ref<FeedbackStatus>(props.feedback?.status ?? FeedbackStatus.OPEN)
const adminNote = ref(props.feedback?.admin_note ?? '')

watch(
  () => props.feedback,
  (value) => {
    selectedStatus.value = value?.status ?? FeedbackStatus.OPEN
    adminNote.value = value?.admin_note ?? ''
  },
  { immediate: true },
)

const statusOptions = Object.values(FeedbackStatus).map((value) => ({
  label: feedbackStatusLabels[value as FeedbackStatus],
  value,
}))

const closeAndRefresh = (refresh = false) => {
  model.value = false
  emit('close', refresh)
}

const handleSave = async () => {
  if (!props.feedback) return
  await store.updateAppFeedback(props.feedback, selectedStatus.value, adminNote.value.trim())
  if (store.modalStatus === Status.OK) closeAndRefresh(true)
}

const displayName = computed(() => {
  if (!props.feedback) return ''
  return `${props.feedback.first_name ?? ''} ${props.feedback.last_name ?? ''}`.trim()
})
</script>

<template>
  <Dialog v-model:visible="model" modal header="App Feedback" class="w-full max-w-2xl mx-4">
    <div v-if="feedback" class="flex flex-col gap-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-surface-500">User</p>
          <p class="font-medium">{{ displayName || 'Unknown User' }}</p>
        </div>
        <div>
          <p class="text-sm text-surface-500">Email</p>
          <p class="font-medium">{{ feedback.email || 'N/A' }}</p>
        </div>
        <div>
          <p class="text-sm text-surface-500">Category</p>
          <p class="font-medium">
            {{ feedbackCategoryLabels[feedback.category as FeedbackCategory] || feedback.category }}
          </p>
        </div>
        <div>
          <p class="text-sm text-surface-500">Status</p>
          <p class="font-medium">
            {{ feedbackStatusLabels[feedback.status as FeedbackStatus] || feedback.status }}
          </p>
        </div>
      </div>

      <div
        v-if="feedback.device_os || feedback.device_model || feedback.app_version"
        class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 p-3"
      >
        <p class="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Device Info</p>
        <div class="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p class="text-surface-500 text-xs">OS</p>
            <p class="font-medium truncate">{{ feedback.device_os || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-surface-500 text-xs">Model</p>
            <p class="font-medium truncate">{{ feedback.device_model || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-surface-500 text-xs">App Version</p>
            <p class="font-medium truncate">{{ feedback.app_version || 'N/A' }}</p>
          </div>
        </div>
      </div>

      <div>
        <p class="text-sm text-surface-500 mb-1">Title</p>
        <p class="font-semibold">{{ feedback.title }}</p>
      </div>

      <div>
        <p class="text-sm text-surface-500 mb-2">Description</p>
        <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-4 whitespace-pre-wrap text-sm">
          {{ feedback.body }}
        </div>
      </div>

      <div class="flex flex-col gap-3 pt-2 border-t border-surface-200 dark:border-surface-700">
        <p class="text-sm font-semibold text-surface-600 dark:text-surface-300">Admin Actions</p>
        <div>
          <label class="text-sm text-surface-500 block mb-1" for="feedback_status">Status</label>
          <Select
            id="feedback_status"
            v-model="selectedStatus"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm text-surface-500" for="admin_note">Admin Note (visible to user)</label>
          <Textarea id="admin_note" v-model="adminNote" rows="3" fluid placeholder="Optional note for the user..." />
        </div>
        <div class="flex justify-end">
          <Button
            label="Save"
            icon="pi pi-save"
            :loading="store.modalStatus === Status.LOADING"
            @click="handleSave"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>
