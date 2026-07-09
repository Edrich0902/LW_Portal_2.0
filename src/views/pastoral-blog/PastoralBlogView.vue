<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import LwpSkeletonTable from '@components/lwp-skeleton-table/LwpSkeletonTable.vue'
import LwpEmptyState from '@components/lwp-empty-state/LwpEmptyState.vue'
import LwpImage from '@components/lwp-image/LwpImage.vue'
import { usePastoralBlogStore } from '@stores/pastoral-blog/pastoral-blog.store.ts'
import { Status } from '@/types/status.ts'
import type { PastoralPost } from '@/types/pastoral-blog/pastoral-post.ts'
import moment from 'moment'

type PublishFilter = 'all' | 'draft' | 'published'

const PAGE_SIZE = 20

const store = usePastoralBlogStore()
const router = useRouter()
const confirm = useConfirm()

const searchText = ref('')
const publishFilter = ref<PublishFilter>('all')
const page = ref(0)

const publishFilterOptions = [
  { label: 'All posts', value: 'all' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Live', value: 'published' },
]

onBeforeMount(async () => {
  await store.loadPosts()
})

const filteredPosts = computed(() => {
  const query = searchText.value.trim().toLowerCase()

  return store.posts.filter((post) => {
    if (publishFilter.value === 'draft' && post.is_published) return false
    if (publishFilter.value === 'published' && !post.is_published) return false

    if (!query) return true

    const haystack = [
      post.title,
      post.author_full_name ?? '',
      post.author_first_name ?? '',
      post.author_last_name ?? '',
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
})

const paginatedPosts = computed(() => {
  const start = page.value * PAGE_SIZE
  return filteredPosts.value.slice(start, start + PAGE_SIZE)
})

watch([searchText, publishFilter], () => {
  page.value = 0
})

watch(
  () => filteredPosts.value.length,
  (count) => {
    const maxPage = Math.max(0, Math.ceil(count / PAGE_SIZE) - 1)
    if (page.value > maxPage) {
      page.value = maxPage
    }
  },
)

const onNewPost = () => {
  router.push({ name: 'PastoralBlogNew' })
}

const onOpenPost = (post: PastoralPost) => {
  router.push({ name: 'PastoralBlogEdit', params: { id: post.id } })
}

const onView = (event: MouseEvent, post: PastoralPost) => {
  event.stopPropagation()
  router.push({ name: 'PastoralBlogRead', params: { id: post.id } })
}

const onTogglePublish = async (event: MouseEvent, post: PastoralPost) => {
  event.stopPropagation()
  await store.setPublished(post.id, !post.is_published)
}

const onDelete = (event: MouseEvent, post: PastoralPost) => {
  event.stopPropagation()
  confirm.require({
    target: event.target as HTMLElement,
    message: `Delete "${post.title}"? This cannot be undone.`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: async () => {
      await store.deletePost(post.id)
    },
    reject: () => {},
  })
}

const onPageChange = (event: { page: number }) => {
  page.value = event.page
}
</script>

<template>
  <PageWrapper show-toolbar title="Pastoral Blog" class="flex flex-col min-h-0">
    <template #search>
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchText" placeholder="Search posts..." />
      </IconField>
    </template>

    <LwpSkeletonTable v-if="store.postsStatus === Status.LOADING" :columns="3" :rows="6" />

    <div v-else class="flex flex-col flex-1 min-h-0 gap-4">
      <div class="flex flex-row items-center justify-between gap-3 shrink-0">
        <Select
          v-model="publishFilter"
          :options="publishFilterOptions"
          option-label="label"
          option-value="value"
          class="w-44"
        />

        <div class="flex items-center gap-2 shrink-0">
          <Button @click="onNewPost" icon="pi pi-plus" label="New post" size="small" rounded raised />
          <Button @click="store.loadPosts()" icon="pi pi-refresh" size="small" rounded raised />
        </div>
      </div>

      <LwpEmptyState
        v-if="store.posts.length === 0"
        title="No Posts Yet"
        description="Create your first pastoral blog post. Drafts save automatically as you write."
      >
        <template #action>
          <Button label="New post" icon="pi pi-plus" @click="onNewPost" />
        </template>
      </LwpEmptyState>

      <LwpEmptyState
        v-else-if="filteredPosts.length === 0"
        title="No Matching Posts"
        description="Try a different search term or filter."
      >
        <template #action>
          <Button
            label="Clear filters"
            icon="pi pi-filter-slash"
            severity="secondary"
            @click="
              () => {
                searchText = ''
                publishFilter = 'all'
              }
            "
          />
        </template>
      </LwpEmptyState>

      <div
        v-else
        class="blog-list-panel flex flex-col flex-1 min-h-0 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden bg-surface-0 dark:bg-surface-900"
      >
        <div class="post-card-grid flex-1 min-h-0 overflow-y-auto p-4">
          <button
            v-for="post in paginatedPosts"
            :key="post.id"
            type="button"
            class="notion-post-card group text-left"
            @click="onOpenPost(post)"
          >
            <div class="notion-post-card__cover">
              <LwpImage
                v-if="post.cover_image_public_id"
                :public-id="post.cover_image_public_id"
                :height="160"
                :width="320"
                class-name="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center bg-surface-100 dark:bg-surface-800"
              >
                <span class="pi pi-file-edit text-2xl text-surface-300 dark:text-surface-600" />
              </div>
            </div>

            <div class="notion-post-card__body">
              <div class="flex items-start justify-between gap-2">
                <h3
                  class="font-semibold text-base leading-snug line-clamp-2 text-surface-900 dark:text-surface-0"
                >
                  {{ post.title }}
                </h3>
                <Tag
                  :severity="post.is_published ? 'success' : 'secondary'"
                  class="shrink-0 text-[10px] uppercase tracking-wide"
                >
                  {{ post.is_published ? 'Live' : 'Draft' }}
                </Tag>
              </div>

              <p class="text-sm text-surface-500 dark:text-surface-400 mt-2">
                {{ post.author_full_name ?? 'Unknown author' }}
                <span class="mx-1">·</span>
                {{ post.updated_at ? moment(post.updated_at).format('DD MMM YYYY') : '—' }}
              </p>

              <div
                class="flex items-center justify-end gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Button
                  v-tooltip.top="'Preview'"
                  icon="pi pi-eye"
                  size="small"
                  severity="secondary"
                  text
                  rounded
                  @click="(event) => onView(event, post)"
                />
                <Button
                  v-tooltip.top="post.is_published ? 'Unpublish' : 'Publish'"
                  :icon="post.is_published ? 'pi pi-eye-slash' : 'pi pi-send'"
                  :severity="post.is_published ? 'secondary' : 'success'"
                  size="small"
                  text
                  rounded
                  :loading="store.actionStatus === Status.LOADING"
                  @click="(event) => onTogglePublish(event, post)"
                />
                <Button
                  v-tooltip.top="'Delete'"
                  icon="pi pi-trash"
                  size="small"
                  severity="danger"
                  text
                  rounded
                  @click="(event) => onDelete(event, post)"
                />
              </div>
            </div>
          </button>
        </div>

        <Paginator
          :rows="PAGE_SIZE"
          :total-records="filteredPosts.length"
          :first="page * PAGE_SIZE"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          class="shrink-0"
          @page="onPageChange"
        />
      </div>
    </div>
  </PageWrapper>
</template>

<style scoped>
.post-card-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
  align-items: start;
  align-content: start;
}

@media (min-width: 768px) {
  .post-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .post-card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.notion-post-card {
  display: flex;
  flex-direction: column;
  height: auto;
  align-self: start;
  cursor: pointer;
  border-radius: 1rem;
  border: 1px solid var(--p-surface-200);
  background: var(--p-surface-0);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.dark .notion-post-card {
  border-color: var(--p-surface-700);
  background: var(--p-surface-900);
  box-shadow: none;
}

.notion-post-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--p-primary-400) 35%, var(--p-surface-200));
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.dark .notion-post-card:hover {
  border-color: color-mix(in srgb, var(--p-primary-400) 30%, var(--p-surface-700));
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.22);
}

.notion-post-card__cover {
  height: 9rem;
  flex-shrink: 0;
  overflow: hidden;
  border-bottom: 1px solid var(--p-surface-100);
}

.dark .notion-post-card__cover {
  border-bottom-color: var(--p-surface-800);
}

.notion-post-card__body {
  padding: 1rem 1rem 0.75rem;
}
</style>
