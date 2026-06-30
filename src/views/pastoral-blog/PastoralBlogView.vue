<script setup lang="ts">
import { onBeforeMount } from 'vue'
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

const store = usePastoralBlogStore()
const router = useRouter()
const confirm = useConfirm()

onBeforeMount(async () => {
  await store.loadPosts()
})

const onNewPost = () => {
  router.push({ name: 'PastoralBlogNew' })
}

const onEdit = (post: PastoralPost) => {
  router.push({ name: 'PastoralBlogEdit', params: { id: post.id } })
}

const onView = (post: PastoralPost) => {
  router.push({ name: 'PastoralBlogRead', params: { id: post.id } })
}

const onTogglePublish = async (post: PastoralPost) => {
  await store.setPublished(post.id, !post.is_published)
}

const onDelete = (event: MouseEvent, post: PastoralPost) => {
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
</script>

<template>
  <PageWrapper show-toolbar title="Pastoral Blog" class="flex flex-col">
    <LwpSkeletonTable v-if="store.postsStatus === Status.LOADING" :columns="5" :rows="8" />

    <DataTable
      v-else
      :value="store.posts"
      data-key="id"
      striped-rows
      scrollable
      row-hover
      scroll-height="flex"
      class="flex-1"
    >
      <template #header>
        <div class="flex flex-row items-center justify-end gap-2">
          <Button @click="onNewPost" icon="pi pi-plus" label="New Post" size="small" rounded raised />
          <Button @click="store.loadPosts()" icon="pi pi-refresh" size="small" rounded raised />
        </div>
      </template>

      <template #empty>
        <LwpEmptyState
          title="No Posts Yet"
          description="Write your first pastoral blog post to get started."
        >
          <template #action>
            <Button label="New Post" icon="pi pi-plus" @click="onNewPost" />
          </template>
        </LwpEmptyState>
      </template>

      <Column header="Cover" style="width: 70px">
        <template #body="{ data }">
          <LwpImage
            v-if="data.cover_image_public_id"
            :public-id="data.cover_image_public_id"
            :height="40"
            :width="40"
            class-name="w-10 h-10 object-cover rounded-lg shadow-sm"
            preview
          />
          <div
            v-else
            class="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center"
          >
            <span class="pi pi-image text-surface-400 text-sm" />
          </div>
        </template>
      </Column>

      <Column field="title" header="Title" style="min-width: 200px">
        <template #body="{ data }">
          <span class="font-medium max-w-xs truncate block" :title="data.title">{{ data.title }}</span>
        </template>
      </Column>

      <Column field="author_full_name" header="Author" style="min-width: 140px">
        <template #body="{ data }">
          <span class="text-surface-600 dark:text-surface-300">{{ data.author_full_name ?? '—' }}</span>
        </template>
      </Column>

      <Column field="is_published" header="Status" style="width: 120px">
        <template #body="{ data }">
          <Tag
            :severity="data.is_published ? 'success' : 'secondary'"
            class="flex items-center gap-1.5 px-3 py-1"
          >
            <template #icon>
              <i :class="data.is_published ? 'pi pi-check-circle' : 'pi pi-pencil'" class="text-[11px]" />
            </template>
            <span class="text-[11px] font-bold uppercase tracking-wider">
              {{ data.is_published ? 'Published' : 'Draft' }}
            </span>
          </Tag>
        </template>
      </Column>

      <Column field="created_at" header="Created" style="min-width: 140px">
        <template #body="{ data }">
          <span class="text-surface-500 dark:text-surface-400 text-sm">
            {{ data.created_at ? moment(data.created_at).format('DD MMM YYYY') : '—' }}
          </span>
        </template>
      </Column>

      <Column header="" style="width: 200px">
        <template #body="{ data }">
          <div class="flex flex-row items-center justify-end gap-1.5">
            <Button
              v-tooltip.top="'View'"
              icon="pi pi-eye"
              size="small"
              severity="secondary"
              text
              rounded
              @click="onView(data)"
            />
            <Button
              v-tooltip.top="'Edit'"
              icon="pi pi-pencil"
              size="small"
              severity="secondary"
              text
              rounded
              @click="onEdit(data)"
            />
            <Button
              v-tooltip.top="data.is_published ? 'Unpublish' : 'Publish'"
              :icon="data.is_published ? 'pi pi-eye-slash' : 'pi pi-send'"
              :severity="data.is_published ? 'secondary' : 'success'"
              size="small"
              text
              rounded
              :loading="store.actionStatus === Status.LOADING"
              @click="onTogglePublish(data)"
            />
            <Button
              v-tooltip.top="'Delete'"
              icon="pi pi-trash"
              size="small"
              severity="danger"
              text
              rounded
              @click.stop="(e) => onDelete(e, data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </PageWrapper>
</template>
