<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import moment from 'moment'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import LwpImageUploader from '@components/lwp-image/LwpImageUploader.vue'
import LwpImage from '@components/lwp-image/LwpImage.vue'
import LwpQuillEditor from '@components/lwp-quill-editor/LwpQuillEditor.vue'
import { usePastoralBlogStore } from '@stores/pastoral-blog/pastoral-blog.store.ts'
import { usePastoralBlogAutosave } from '@/composables/usePastoralBlogAutosave.ts'
import { EMPTY_PASTORAL_CONTENT } from '@/utils/pastoral-blog-content.ts'
import { Status } from '@/types/status.ts'

const props = defineProps<{
  id?: string
}>()

const store = usePastoralBlogStore()
const router = useRouter()

const postId = ref<string | undefined>(props.id)
const isBootstrapping = ref(true)
const isHydrated = ref(false)
const isPublishing = ref(false)

const title = ref('')
const content = ref(EMPTY_PASTORAL_CONTENT)
const coverImageUrl = ref<string | null>(null)
const coverImagePublicId = ref<string | null>(null)
const isPublished = ref(false)

const { markSnapshotSaved } = usePastoralBlogAutosave({
  postId,
  title,
  content,
  coverImageUrl,
  coverImagePublicId,
  isHydrated,
})

const hydrateFromPost = (id: string) => {
  const existing = store.posts.find((post) => post.id === id)
  if (!existing) return false

  title.value = existing.title
  content.value = existing.content
  coverImageUrl.value = existing.cover_image_url ?? null
  coverImagePublicId.value = existing.cover_image_public_id ?? null
  isPublished.value = existing.is_published

  markSnapshotSaved({
    title: existing.title,
    content: existing.content,
    coverImageUrl: existing.cover_image_url ?? null,
    coverImagePublicId: existing.cover_image_public_id ?? null,
  })

  return true
}

onBeforeMount(async () => {
  if (store.postsStatus === Status.UNINITIALIZED) {
    await store.loadPosts()
  }

  if (props.id) {
    postId.value = props.id
    if (!hydrateFromPost(props.id)) {
      await store.loadPosts()
      hydrateFromPost(props.id)
    }
    isBootstrapping.value = false
    isHydrated.value = true
    return
  }

  const draftId = await store.createDraftPost()
  if (!draftId) {
    isBootstrapping.value = false
    return
  }

  postId.value = draftId
  await router.replace({ name: 'PastoralBlogEdit', params: { id: draftId } })
  hydrateFromPost(draftId)
  isBootstrapping.value = false
  isHydrated.value = true
})

watch(isPublished, async (shouldPublish, previous) => {
  if (!isHydrated.value || !postId.value || shouldPublish === previous || isPublishing.value) {
    return
  }

  isPublishing.value = true
  await store.setPublished(postId.value, shouldPublish)
  isPublishing.value = false
})

const saveStatusLabel = computed(() => {
  if (store.autosaveStatus === 'saving') return 'Saving...'
  if (store.autosaveStatus === 'error') return 'Save failed — retrying on next edit'
  if (store.lastSavedAt) return `Saved ${moment(store.lastSavedAt).fromNow()}`
  return 'All changes saved'
})

const saveStatusClass = computed(() => {
  if (store.autosaveStatus === 'error') {
    return 'text-red-500 dark:text-red-400'
  }
  if (store.autosaveStatus === 'saving') {
    return 'text-surface-400 dark:text-surface-500'
  }
  return 'text-surface-500 dark:text-surface-400'
})

const onUpload = (info: { public_id: string; secure_url: string }) => {
  coverImagePublicId.value = info.public_id
  coverImageUrl.value = info.secure_url
}

const onRemoveCover = () => {
  coverImagePublicId.value = null
  coverImageUrl.value = null
}

const onBack = () => {
  router.push({ name: 'PastoralBlog' })
}

const onTitleFocus = (event: FocusEvent) => {
  const input = event.target as HTMLInputElement
  if (title.value.trim() === 'Untitled') {
    input.select()
  }
}
</script>

<template>
  <PageWrapper show-toolbar title="Pastoral Blog" class="flex flex-col overflow-hidden">
    <div
      class="flex items-center justify-between gap-4 py-2 border-b border-surface-200 dark:border-surface-700 shrink-0"
    >
      <Button
        label="All posts"
        icon="pi pi-arrow-left"
        severity="secondary"
        text
        size="small"
        @click="onBack"
      />

      <div class="flex items-center gap-4 min-w-0">
        <div class="hidden sm:flex items-center gap-2 min-w-0" :class="saveStatusClass">
          <i
            class="text-xs shrink-0"
            :class="store.autosaveStatus === 'saving' ? 'pi pi-spin pi-spinner' : 'pi pi-cloud'"
          />
          <span class="text-sm truncate">{{ saveStatusLabel }}</span>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <ToggleSwitch
            v-model="isPublished"
            input-id="publish-toggle"
            :disabled="isBootstrapping || isPublishing"
          />
          <label
            for="publish-toggle"
            class="text-sm font-medium cursor-pointer select-none"
            :class="
              isPublished
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-surface-400 dark:text-surface-500'
            "
          >
            {{ isPublished ? 'Published' : 'Draft' }}
          </label>
        </div>
      </div>
    </div>

    <div v-if="isBootstrapping" class="flex-1 flex items-center justify-center">
      <ProgressSpinner style="width: 2.5rem; height: 2.5rem" />
    </div>

    <div v-else class="flex-1 overflow-y-auto notion-editor-scroll">
      <div class="max-w-3xl mx-auto w-full px-6 py-8 md:py-12 flex flex-col gap-8">
        <div v-if="coverImagePublicId" class="cover-image-frame relative rounded-2xl overflow-hidden group">
          <LwpImage
            :public-id="coverImagePublicId"
            :width="1200"
            :height="420"
            class-name="w-full h-full object-cover"
          />
          <div
            class="absolute inset-0 bg-surface-950/0 group-hover:bg-surface-950/20 transition-colors"
          />
          <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              label="Remove cover"
              icon="pi pi-trash"
              size="small"
              severity="contrast"
              outlined
              class="cover-remove-button"
              @click="onRemoveCover"
            />
          </div>
        </div>

        <div v-else class="flex items-center">
          <LwpImageUploader label="Add cover" @uploaded="onUpload" class="cover-uploader" />
        </div>

        <input
          v-model="title"
          type="text"
          placeholder="Untitled"
          class="notion-title-input"
          @focus="onTitleFocus"
        />

        <LwpQuillEditor
          v-model="content"
          variant="notion"
          placeholder="Start writing, or select text for formatting..."
        />
      </div>
    </div>
  </PageWrapper>
</template>

<style scoped>
.notion-editor-scroll {
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--p-surface-50) 70%, transparent),
      transparent 12rem
    ),
    var(--p-surface-0);
}

.dark .notion-editor-scroll {
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--p-surface-900) 80%, transparent),
      transparent 12rem
    ),
    var(--p-surface-950, var(--p-surface-900));
}

.notion-title-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: clamp(2.25rem, 5vw, 3rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: var(--p-surface-900);
  padding: 0;
}

.dark .notion-title-input {
  color: var(--p-surface-0);
}

.notion-title-input::placeholder {
  color: var(--p-surface-300);
}

.dark .notion-title-input::placeholder {
  color: var(--p-surface-600);
}

.cover-image-frame {
  height: 14rem;
}

@media (min-width: 768px) {
  .cover-image-frame {
    height: 18rem;
  }
}

.cover-uploader :deep(button),
.cover-uploader :deep(.p-button) {
  background: transparent !important;
  border: none !important;
  color: var(--p-surface-400) !important;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem !important;
  width: auto !important;
  box-shadow: none !important;
}

.cover-uploader :deep(button):hover,
.cover-uploader :deep(.p-button):hover {
  background: var(--p-surface-100) !important;
  color: var(--p-surface-600) !important;
}

.dark .cover-uploader :deep(button),
.dark .cover-uploader :deep(.p-button) {
  color: var(--p-surface-500) !important;
}

.dark .cover-uploader :deep(button):hover,
.dark .cover-uploader :deep(.p-button):hover {
  background: var(--p-surface-800) !important;
  color: var(--p-surface-300) !important;
}

.cover-remove-button {
  backdrop-filter: blur(12px);
}

.cover-remove-button :deep(.p-button) {
  background: color-mix(in srgb, var(--p-surface-0) 78%, transparent) !important;
  border: 1px solid color-mix(in srgb, var(--p-surface-0) 30%, var(--p-surface-900) 12%) !important;
  color: var(--p-surface-700) !important;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}

.cover-remove-button :deep(.p-button:hover) {
  background: color-mix(in srgb, var(--p-red-50) 88%, var(--p-surface-0) 12%) !important;
  border-color: color-mix(in srgb, var(--p-red-200) 82%, transparent) !important;
  color: var(--p-red-600) !important;
}

.dark .cover-remove-button :deep(.p-button) {
  background: color-mix(in srgb, var(--p-surface-900) 72%, transparent) !important;
  border-color: color-mix(in srgb, var(--p-surface-0) 16%, transparent) !important;
  color: var(--p-surface-100) !important;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
}

.dark .cover-remove-button :deep(.p-button:hover) {
  background: color-mix(in srgb, var(--p-red-900) 56%, var(--p-surface-900) 44%) !important;
  border-color: color-mix(in srgb, var(--p-red-500) 32%, transparent) !important;
  color: var(--p-red-200) !important;
}
</style>
