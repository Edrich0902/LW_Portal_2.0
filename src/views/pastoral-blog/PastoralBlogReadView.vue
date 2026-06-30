<script setup lang="ts">
import { computed, onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import moment from 'moment'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import LwpEmptyState from '@components/lwp-empty-state/LwpEmptyState.vue'
import LwpImage from '@components/lwp-image/LwpImage.vue'
import LwpQuillViewer from '@components/lwp-quill-viewer/LwpQuillViewer.vue'
import { usePastoralBlogStore } from '@stores/pastoral-blog/pastoral-blog.store.ts'
import { Status } from '@/types/status.ts'

const props = defineProps<{
  id: string
}>()

const store = usePastoralBlogStore()
const router = useRouter()

const post = computed(() => store.posts.find((item) => item.id === props.id) ?? null)

onBeforeMount(async () => {
  if (store.postsStatus === Status.UNINITIALIZED) {
    await store.loadPosts()
  }
})

const onBack = () => {
  router.push({ name: 'PastoralBlog' })
}

const onEdit = () => {
  router.push({ name: 'PastoralBlogEdit', params: { id: props.id } })
}
</script>

<template>
  <PageWrapper show-toolbar title="View Post" class="flex flex-col overflow-hidden">
    <div class="flex items-center justify-between py-2 border-b border-surface-200 dark:border-surface-700 shrink-0">
      <Button
        label="Back"
        icon="pi pi-arrow-left"
        severity="secondary"
        text
        size="small"
        @click="onBack"
      />
      <Button
        v-if="post"
        label="Edit"
        icon="pi pi-pencil"
        size="small"
        severity="secondary"
        @click="onEdit"
      />
    </div>

    <div class="flex-1 overflow-y-auto">
      <div class="max-w-3xl mx-auto w-full px-4 py-10">
        <div v-if="store.postsStatus === Status.LOADING" class="flex flex-col gap-4">
          <Skeleton height="2.5rem" width="70%" />
          <Skeleton height="1rem" width="35%" />
          <Skeleton height="13rem" borderRadius="1rem" />
          <Skeleton height="18rem" />
        </div>

        <LwpEmptyState
          v-else-if="!post"
          title="Post Not Found"
          description="This post could not be loaded or may no longer exist."
        >
          <template #action>
            <Button label="Back to Posts" icon="pi pi-arrow-left" severity="secondary" @click="onBack" />
          </template>
        </LwpEmptyState>

        <article v-else class="flex flex-col gap-6">
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-3 text-sm text-surface-500 dark:text-surface-400">
              <Tag :severity="post.is_published ? 'success' : 'secondary'" rounded>
                {{ post.is_published ? 'Published' : 'Draft' }}
              </Tag>
              <span>{{ post.author_full_name ?? 'Unknown author' }}</span>
              <span>{{ post.created_at ? moment(post.created_at).format('DD MMM YYYY') : '—' }}</span>
            </div>
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-0">
              {{ post.title }}
            </h1>
          </div>

          <div
            v-if="post.cover_image_public_id"
            class="rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 shadow-sm"
          >
            <LwpImage
              :public-id="post.cover_image_public_id"
              :width="1200"
              :height="480"
              class-name="w-full h-64 md:h-80"
            />
          </div>

          <div class="border-t border-surface-100 dark:border-surface-800 pt-6">
            <LwpQuillViewer :content="post.content" />
          </div>
        </article>
      </div>
    </div>
  </PageWrapper>
</template>
