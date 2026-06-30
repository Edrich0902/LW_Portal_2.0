<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import LwpImageUploader from '@components/lwp-image/LwpImageUploader.vue'
import LwpImage from '@components/lwp-image/LwpImage.vue'
import LwpQuillEditor from '@components/lwp-quill-editor/LwpQuillEditor.vue'
import { usePastoralBlogStore } from '@stores/pastoral-blog/pastoral-blog.store.ts'
import { Status } from '@/types/status.ts'

const props = defineProps<{
  id?: string
}>()

const store = usePastoralBlogStore()
const router = useRouter()

const isEditing = computed(() => !!props.id)
const pageTitle = computed(() => (isEditing.value ? 'Edit Post' : 'New Post'))

const title = ref('')
const content = ref('')
const coverImageUrl = ref<string | null>(null)
const coverImagePublicId = ref<string | null>(null)
const isPublished = ref(false)

onBeforeMount(async () => {
  if (store.postsStatus === Status.UNINITIALIZED) {
    await store.loadPosts()
  }

  if (isEditing.value) {
    const existing = store.posts.find((p) => p.id === props.id)
    if (existing) {
      title.value = existing.title
      content.value = existing.content
      coverImageUrl.value = existing.cover_image_url ?? null
      coverImagePublicId.value = existing.cover_image_public_id ?? null
      isPublished.value = existing.is_published
    }
  }
})

const onUpload = (info: { public_id: string; secure_url: string }) => {
  coverImagePublicId.value = info.public_id
  coverImageUrl.value = info.secure_url
}

const onRemoveCover = () => {
  coverImagePublicId.value = null
  coverImageUrl.value = null
}

const isSaveDisabled = computed(
  () => !title.value.trim() || !content.value || content.value === '{"ops":[{"insert":"\\n"}]}',
)

const onSave = async () => {
  const payload = {
    title: title.value.trim(),
    content: content.value,
    coverImageUrl: coverImageUrl.value,
    coverImagePublicId: coverImagePublicId.value,
  }

  let success = false

  if (isEditing.value && props.id) {
    success = await store.updatePost(props.id, payload)
    if (success && store.posts.find((p) => p.id === props.id)?.is_published !== isPublished.value) {
      await store.setPublished(props.id, isPublished.value)
    }
  } else {
    success = await store.createPost(payload)
    if (success && isPublished.value) {
      const newest = store.posts[0]
      if (newest) await store.setPublished(newest.id, true)
    }
  }

  if (success) {
    router.push({ name: 'PastoralBlog' })
  }
}

const onCancel = () => {
  router.push({ name: 'PastoralBlog' })
}
</script>

<template>
  <PageWrapper show-toolbar :title="pageTitle" class="flex flex-col overflow-hidden">

    <!-- Action bar: sits between the main toolbar and the editor -->
    <div class="flex items-center justify-between py-2 border-b border-surface-200 dark:border-surface-700 shrink-0">
      <Button
        label="Back"
        icon="pi pi-arrow-left"
        severity="secondary"
        text
        size="small"
        @click="onCancel"
      />
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <ToggleSwitch v-model="isPublished" input-id="publish-toggle" />
          <label
            for="publish-toggle"
            class="text-sm font-medium cursor-pointer select-none"
            :class="isPublished
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-surface-400 dark:text-surface-500'"
          >
            {{ isPublished ? 'Published' : 'Draft' }}
          </label>
        </div>
        <Button
          label="Save"
          icon="pi pi-check"
          size="small"
          :loading="store.actionStatus === Status.LOADING"
          :disabled="isSaveDisabled"
          @click="onSave"
        />
      </div>
    </div>

    <!-- Scrollable editor area -->
    <div class="flex-1 overflow-y-auto">
      <div class="max-w-2xl mx-auto w-full px-4 py-10 flex flex-col gap-6">

        <!-- Title: large, borderless -->
        <InputText
          v-model="title"
          placeholder="Post title..."
          class="editor-title-input w-full"
          :pt="{
            root: { class: 'border-none shadow-none bg-transparent !text-3xl !font-bold !p-0 !rounded-none placeholder:text-surface-300 dark:placeholder:text-surface-600' }
          }"
        />

        <!-- Cover image: inline, subtle -->
        <div v-if="coverImagePublicId" class="cover-image-frame relative rounded-xl overflow-hidden shadow-md">
          <LwpImage
            :public-id="coverImagePublicId"
            :width="800"
            :height="300"
            class-name="w-full h-full"
          />
          <div class="absolute top-3 right-3 z-10">
            <Button
              label="Remove image"
              icon="pi pi-trash"
              size="small"
              severity="contrast"
              outlined
              class="cover-remove-button"
              @click="onRemoveCover"
            />
          </div>
        </div>
        <div v-else>
          <LwpImageUploader label="Add cover image" @uploaded="onUpload" class="cover-uploader" />
        </div>

        <!-- Divider before editor -->
        <div class="border-t border-surface-100 dark:border-surface-800" />

        <!-- Quill editor: seamless -->
        <div class="seamless-editor">
          <LwpQuillEditor
            v-model="content"
            placeholder="Write your post here..."
          />
        </div>

      </div>
    </div>

  </PageWrapper>
</template>

<style scoped>
/* Borderless title input */
.editor-title-input :deep(input) {
  background: transparent;
  border: none;
  box-shadow: none;
  font-size: 1.875rem;
  font-weight: 700;
  padding: 0;
  border-radius: 0;
  color: inherit;
  outline: none;
  width: 100%;
}

.editor-title-input :deep(input):focus {
  box-shadow: none;
  border: none;
  outline: none;
}

/* Seamless Quill editor: remove all box chrome */
.seamless-editor :deep(.lwp-quill-editor) {
  display: flex;
  flex-direction: column;
}

.seamless-editor :deep(.ql-toolbar) {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--p-surface-200);
  padding: 0 0 0.5rem 0;
}

.dark .seamless-editor :deep(.ql-toolbar) {
  border-bottom-color: var(--p-surface-700);
}

.seamless-editor :deep(.ql-container) {
  border: none;
  background: transparent;
  font-size: 1.0625rem;
  min-height: 40vh;
}

.seamless-editor :deep(.ql-editor) {
  padding: 1rem 0 0 0;
  min-height: 40vh;
  line-height: 1.8;
}

/* Cover uploader: make it subtle, not a big blue button */
.cover-uploader :deep(button),
.cover-uploader :deep(.p-button) {
  background: transparent !important;
  border: 1px dashed var(--p-surface-300) !important;
  color: var(--p-surface-400) !important;
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  width: auto !important;
}

.dark .cover-uploader :deep(button),
.dark .cover-uploader :deep(.p-button) {
  border-color: var(--p-surface-600) !important;
  color: var(--p-surface-500) !important;
}

.cover-uploader :deep(button):hover,
.cover-uploader :deep(.p-button):hover {
  background: var(--p-surface-100) !important;
  color: var(--p-surface-700) !important;
}

.dark .cover-uploader :deep(button):hover,
.dark .cover-uploader :deep(.p-button):hover {
  background: var(--p-surface-800) !important;
  color: var(--p-surface-300) !important;
}

.cover-image-frame {
  height: 13rem;
}

.cover-image-frame :deep(.relative) {
  width: 100%;
  height: 100%;
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
