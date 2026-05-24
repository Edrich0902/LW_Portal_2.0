<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Status } from '@/types/status.ts'
import type { PrayerRequest } from '@/types/prayer-request/prayer-request.ts'
import {
  PrayerCategory,
  PrayerRequestStatus,
  prayerCategoryLabels,
  prayerStatusLabels,
} from '@/types/prayer-request/prayer-request.ts'
import { usePrayerRequestsStore } from '@stores/prayer-requests/prayer-requests.store.ts'

const store = usePrayerRequestsStore()

const props = defineProps<{
  visible: boolean
  prayerRequest?: PrayerRequest
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close', value: boolean): void
}>()

const model = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
})

const moderationNote = ref(props.prayerRequest?.moderation_note ?? '')

watch(
  () => props.prayerRequest,
  (value) => {
    moderationNote.value = value?.moderation_note ?? ''
  },
  { immediate: true },
)

const closeAndRefresh = (refresh = false) => {
  model.value = false
  emit('close', refresh)
}

const handleAction = async (nextStatus: PrayerRequestStatus) => {
  if (!props.prayerRequest) return
  await store.moderatePrayerRequest(props.prayerRequest, nextStatus, moderationNote.value.trim())
  if (store.modalStatus === Status.OK) closeAndRefresh(true)
}

const displayName = computed(() => {
  if (!props.prayerRequest) return ''
  return `${props.prayerRequest.first_name ?? ''} ${props.prayerRequest.last_name ?? ''}`.trim()
})
</script>

<template>
  <Dialog v-model:visible="model" modal header="Prayer Request" class="w-[42rem] max-w-[95vw]">
    <div v-if="prayerRequest" class="flex flex-col gap-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-surface-500">Requester</p>
          <p class="font-medium">{{ displayName || 'Unknown User' }}</p>
        </div>
        <div>
          <p class="text-sm text-surface-500">Email</p>
          <p class="font-medium">{{ prayerRequest.email || 'N/A' }}</p>
        </div>
        <div>
          <p class="text-sm text-surface-500">Category</p>
          <p class="font-medium">
            {{ prayerCategoryLabels[prayerRequest.category as PrayerCategory] || prayerRequest.category }}
          </p>
        </div>
        <div>
          <p class="text-sm text-surface-500">Status</p>
          <p class="font-medium">
            {{ prayerStatusLabels[prayerRequest.status as PrayerRequestStatus] || prayerRequest.status }}
          </p>
        </div>
        <div>
          <p class="text-sm text-surface-500">Anonymous</p>
          <p class="font-medium">{{ prayerRequest.is_anonymous ? 'Yes' : 'No' }}</p>
        </div>
        <div>
          <p class="text-sm text-surface-500">Reaction Count</p>
          <p class="font-medium">{{ prayerRequest.reaction_count ?? 0 }}</p>
        </div>
      </div>

      <div>
        <p class="text-sm text-surface-500 mb-2">Prayer Request</p>
        <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-4 whitespace-pre-wrap">
          {{ prayerRequest.body }}
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm text-surface-500" for="moderation_note">Moderation Note</label>
        <Textarea id="moderation_note" v-model="moderationNote" rows="4" fluid />
      </div>

      <div class="flex flex-wrap justify-end gap-2 pt-2">
        <Button
          label="Approve"
          icon="pi pi-check"
          severity="success"
          :loading="store.modalStatus === Status.LOADING"
          @click="handleAction(PrayerRequestStatus.APPROVED)"
        />
        <Button
          label="Reject"
          icon="pi pi-times"
          severity="danger"
          outlined
          :loading="store.modalStatus === Status.LOADING"
          @click="handleAction(PrayerRequestStatus.REJECTED)"
        />
        <Button
          label="Resolve"
          icon="pi pi-check-circle"
          severity="contrast"
          outlined
          :loading="store.modalStatus === Status.LOADING"
          @click="handleAction(PrayerRequestStatus.RESOLVED)"
        />
      </div>
    </div>
  </Dialog>
</template>
