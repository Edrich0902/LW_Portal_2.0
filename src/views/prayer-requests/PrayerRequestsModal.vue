<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import moment from 'moment'
import { Status } from '@/types/status.ts'
import type { PrayerRequest } from '@/types/prayer-request/prayer-request.ts'
import {
  PrayerCategory,
  PrayerRequestStatus,
  prayerCategoryLabels,
  prayerStatusLabels,
} from '@/types/prayer-request/prayer-request.ts'
import { usePrayerRequestsStore } from '@stores/prayer-requests/prayer-requests.store.ts'
import { useAuthStore } from '@stores/auth/auth.store.ts'
import LwpSkeletonTable from '@components/lwp-skeleton-table/LwpSkeletonTable.vue'
import LwpEmptyState from '@components/lwp-empty-state/LwpEmptyState.vue'

const store = usePrayerRequestsStore()
const auth = useAuthStore()

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

const activeTab = ref('details')
const moderationNote = ref(props.prayerRequest?.moderation_note ?? '')
const noteBody = ref('')

watch(
  () => props.prayerRequest,
  (value) => {
    moderationNote.value = value?.moderation_note ?? ''
  },
  { immediate: true },
)

watch(
  () => props.visible,
  async (isVisible) => {
    if (isVisible && props.prayerRequest?.id) {
      activeTab.value = 'details'
      noteBody.value = ''
      await store.fetchNotes(props.prayerRequest.id)
    }
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

const handleTogglePrivate = async (value: boolean) => {
  if (!props.prayerRequest?.id) return
  await store.togglePrivate(props.prayerRequest.id, value)
}

const handleAddNote = async () => {
  if (!props.prayerRequest?.id || !noteBody.value.trim()) return
  await store.addNote(props.prayerRequest.id, noteBody.value)
  if (store.notesActionStatus === Status.OK) {
    noteBody.value = ''
  }
}

const handleDeleteNote = async (noteId: string) => {
  if (!props.prayerRequest?.id) return
  await store.deleteNote(noteId, props.prayerRequest.id)
}

const isCurrentUserNote = (authorUserId: string) => auth.user?.id === authorUserId

const displayName = computed(() => {
  if (!props.prayerRequest) return ''
  return `${props.prayerRequest.first_name ?? ''} ${props.prayerRequest.last_name ?? ''}`.trim()
})
</script>

<template>
  <Dialog v-model:visible="model" modal header="Prayer Request" class="w-full max-w-2xl mx-4">
    <div v-if="prayerRequest">
      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="details">
            <span class="flex items-center gap-2">
              <i class="pi pi-file-edit" />
              Details
            </span>
          </Tab>
          <Tab value="notes">
            <span class="flex items-center gap-2">
              <i class="pi pi-comments" />
              Pastoral Notes
              <Tag
                v-if="store.notes.length"
                :value="store.notes.length"
                severity="secondary"
                class="ml-1"
              />
            </span>
          </Tab>
        </TabList>

        <TabPanels>
          <!-- Details Tab -->
          <TabPanel value="details">
            <div class="flex flex-col gap-4 pt-4">
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

              <div class="flex items-center justify-between rounded-xl border border-surface-200 dark:border-surface-700 p-3">
                <div>
                  <p class="text-sm font-medium">Private Request</p>
                  <p class="text-xs text-surface-500">Hidden from the public app view.</p>
                </div>
                <ToggleSwitch
                  :model-value="prayerRequest.is_private ?? false"
                  :disabled="store.modalStatus === Status.LOADING"
                  @update:model-value="handleTogglePrivate"
                />
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
          </TabPanel>

          <!-- Pastoral Notes Tab -->
          <TabPanel value="notes">
            <div class="flex flex-col gap-4 pt-4">
              <LwpSkeletonTable
                v-if="store.notesStatus === Status.LOADING"
                :columns="1"
                :rows="3"
              />

              <LwpEmptyState
                v-else-if="store.notesStatus === Status.ERROR"
                title="Could Not Load Notes"
                description="There was an error loading notes. Try refreshing."
              />

              <template v-else>
                <LwpEmptyState
                  v-if="store.notes.length === 0"
                  title="No Notes Yet"
                  description="Add the first pastoral note for this request."
                />

                <div v-else class="flex flex-col gap-3">
                  <div
                    v-for="note in store.notes"
                    :key="note.id"
                    class="rounded-xl border border-surface-200 dark:border-surface-700 p-3"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <p class="text-sm font-semibold">{{ note.author_full_name || 'Admin' }}</p>
                        <p class="text-xs text-surface-500">
                          {{ moment(note.created_at).format('DD MMM YYYY HH:mm') }}
                        </p>
                      </div>
                      <Button
                        v-if="isCurrentUserNote(note.author_user_id)"
                        icon="pi pi-trash"
                        severity="danger"
                        variant="outlined"
                        size="small"
                        :loading="store.notesActionStatus === Status.LOADING"
                        @click="handleDeleteNote(note.id)"
                      />
                    </div>
                    <p class="mt-2 text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
                      {{ note.body }}
                    </p>
                  </div>
                </div>

                <div class="flex flex-col gap-2 border-t border-surface-200 dark:border-surface-700 pt-4">
                  <label class="text-sm font-medium" for="note_body">Add a Note</label>
                  <Textarea
                    id="note_body"
                    v-model="noteBody"
                    rows="3"
                    placeholder="Write a pastoral note..."
                    fluid
                  />
                  <div class="flex justify-end">
                    <Button
                      label="Add Note"
                      icon="pi pi-plus"
                      :disabled="!noteBody.trim()"
                      :loading="store.notesActionStatus === Status.LOADING"
                      @click="handleAddNote"
                    />
                  </div>
                </div>
              </template>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </Dialog>
</template>
