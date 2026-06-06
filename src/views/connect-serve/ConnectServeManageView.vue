<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import moment from 'moment'
import { useConfirm } from 'primevue'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import LwpImage from '@components/lwp-image/LwpImage.vue'
import LwpEmptyState from '@components/lwp-empty-state/LwpEmptyState.vue'
import LwpSkeletonTable from '@components/lwp-skeleton-table/LwpSkeletonTable.vue'
import { useConnectServeStore } from '@stores/connect-serve/connect-serve.store.ts'
import { Status } from '@/types/status.ts'
import type { GroupMembership } from '@/types/group/group-membership.ts'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const store = useConnectServeStore()
const selectedLeaderId = ref<string | undefined>(undefined)

const groupId = computed(() => String(route.params.id ?? ''))

onBeforeMount(async () => {
  if (!groupId.value) return
  await Promise.all([
    store.loadConnectServeGroup(groupId.value),
    store.loadGroupMemberships(groupId.value),
    store.loadMembershipCandidates(),
    store.loadGroupPosts(groupId.value),
  ])
})

const onRefresh = async () => {
  if (!groupId.value) return
  await Promise.all([
    store.loadConnectServeGroup(groupId.value),
    store.loadGroupMemberships(groupId.value),
    store.loadGroupPosts(groupId.value),
  ])
}

const fullName = (person?: {
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  email?: string | null
}) => {
  return (
    person?.full_name?.trim() ||
    [person?.first_name, person?.last_name].filter(Boolean).join(' ').trim() ||
    person?.email ||
    'Unknown User'
  )
}

const openEdit = () => {
  router.push({
    name: 'ConnectServe',
    query: {
      edit: groupId.value,
    },
  })
}

const leaderOptions = computed(() =>
  store.membershipCandidates
    .filter(
      (candidate) =>
        candidate.id &&
        !store.activeLeaders.some((leader) => leader.user_id === candidate.id),
    )
    .map((candidate) => ({
      label:
        [candidate.first_name, candidate.last_name].filter(Boolean).join(' ').trim() ||
        candidate.email,
      value: candidate.id,
    })),
)

const assignLeader = async () => {
  if (!selectedLeaderId.value) return
  const success = await store.setGroupLeader(groupId.value, selectedLeaderId.value, true)
  if (success) {
    selectedLeaderId.value = undefined
  }
}

const approveRequest = async (membership: GroupMembership) => {
  await store.approveGroupMembership(groupId.value, membership.user_id)
}

const declineRequest = async (membership: GroupMembership) => {
  await store.declineGroupMembership(groupId.value, membership.user_id)
}

const removeMember = async (membership: GroupMembership) => {
  confirm.require({
    message: `Remove ${fullName(membership)} from this group?`,
    icon: 'pi pi-info-circle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Remove',
      severity: 'danger',
    },
    accept: async () => {
      await store.removeGroupMember(groupId.value, membership.user_id)
    },
  })
}

const promoteMember = async (membership: GroupMembership) => {
  await store.setGroupLeader(groupId.value, membership.user_id, true)
}

const removeLeader = async (membership: GroupMembership) => {
  await store.setGroupLeader(groupId.value, membership.user_id, false)
}

const formatDateTime = (value?: string | null) =>
  value ? moment(value).format('DD MMM YYYY HH:mm') : 'N/A'

const initials = (person: {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}) => {
  const f = (person.first_name ?? '').trim()
  const l = (person.last_name ?? '').trim()
  if (f && l) return (f[0] + l[0]).toUpperCase()
  if (f) return f[0].toUpperCase()
  return (person.email ?? '?')[0].toUpperCase()
}

const pinPost = async (postId: string, shouldPin: boolean) => {
  await store.pinGroupPost(groupId.value, postId, shouldPin)
}

const deletePost = (postId: string, postTitle?: string | null) => {
  confirm.require({
    message: `Delete ${postTitle?.trim() ? `"${postTitle.trim()}"` : 'this post'}?`,
    icon: 'pi pi-info-circle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger',
    },
    accept: async () => {
      await store.removeGroupPost(groupId.value, postId)
    },
  })
}
</script>

<template>
  <PageWrapper show-toolbar title="Manage Group" class="flex flex-col gap-4">
    <template #search>
      <div class="flex items-center gap-2">
        <Button
          label="Back"
          icon="pi pi-arrow-left"
          severity="secondary"
          variant="outlined"
          size="small"
          @click="$router.push('/connect-serve')"
        />
        <Button label="Edit Group" icon="pi pi-pencil" size="small" @click="openEdit" />
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          severity="secondary"
          size="small"
          @click="onRefresh"
        />
      </div>
    </template>

    <div
      v-if="store.currentGroupStatus === Status.LOADING || store.membershipsStatus === Status.LOADING"
      class="flex flex-col gap-4"
    >
      <LwpSkeletonTable :columns="5" :rows="4" />
      <LwpSkeletonTable :columns="5" :rows="6" />
    </div>

    <LwpEmptyState
      v-else-if="store.currentGroupStatus === Status.ERROR || !store.currentGroup"
      title="Group Not Found"
      description="This group could not be loaded. Try going back to the list and opening it again."
    />

    <template v-else>
      <!-- ── Group header — one card, flat internals ────────────────── -->
      <div class="rounded-xl border border-surface-200 bg-surface-0 p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900">
        <div class="flex items-start gap-4">
          <LwpImage
            :public-id="store.currentGroup.banner_public_id"
            :height="160"
            :width="256"
            class-name="h-32 w-52 shrink-0 rounded-xl object-cover"
          />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-xl font-semibold">{{ store.currentGroup.title }}</h2>
              <Tag severity="secondary">{{ store.currentGroup.type }}</Tag>
            </div>
            <p class="mt-1 line-clamp-2 text-sm leading-relaxed text-surface-500 dark:text-surface-400">
              {{ store.currentGroup.description }}
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span>
                <span class="font-semibold text-surface-900 dark:text-surface-0">{{ store.activeLeaders.length }}</span>
                <span class="ml-1 text-surface-500">leaders</span>
              </span>
              <span class="text-surface-300 dark:text-surface-600">·</span>
              <span>
                <span class="font-semibold text-surface-900 dark:text-surface-0">{{ store.activeMembers.length }}</span>
                <span class="ml-1 text-surface-500">members</span>
              </span>
              <span class="text-surface-300 dark:text-surface-600">·</span>
              <span>
                <span class="font-semibold text-surface-900 dark:text-surface-0">{{ store.pendingMembers.length }}</span>
                <span class="ml-1 text-surface-500">pending</span>
              </span>
              <span class="text-surface-300 dark:text-surface-600">·</span>
              <span>
                <span class="font-semibold text-surface-900 dark:text-surface-0">{{ store.posts.length }}</span>
                <span class="ml-1 text-surface-500">posts</span>
              </span>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-500">
              <span class="flex items-center gap-1">
                <i class="pi pi-map-marker" />
                {{ store.currentGroup.location || 'No location set' }}
              </span>
              <span class="flex items-center gap-1">
                <i class="pi pi-whatsapp" />
                {{ store.currentGroup.whatsappLink || 'No WhatsApp link' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tabs — single surface wrapper ─────────────────────────── -->
      <div class="rounded-xl border border-surface-200 bg-surface-0 shadow-sm dark:border-surface-700 dark:bg-surface-900">
        <Tabs value="members">
          <TabList>
            <Tab value="members">
              <span class="flex items-center gap-2">
                <i class="pi pi-users" />
                Members
                <Tag v-if="store.pendingMembers.length" severity="warn" class="ml-1">
                  {{ store.pendingMembers.length }}
                </Tag>
              </span>
            </Tab>
            <Tab value="feed">
              <span class="flex items-center gap-2">
                <i class="pi pi-comments" />
                Feed
                <Tag v-if="store.posts.length" severity="secondary" class="ml-1">{{ store.posts.length }}</Tag>
              </span>
            </Tab>
          </TabList>

          <TabPanels>
            <!-- ── Members tab ──────────────────────────────────────── -->
            <TabPanel value="members">
              <div class="flex flex-col gap-8 p-4">

                <!-- Leaders -->
                <div>
                  <div class="mb-3 flex items-center justify-between">
                    <div>
                      <h3 class="text-base font-semibold">Leaders</h3>
                      <p class="text-sm text-surface-500">Group-scoped moderation access.</p>
                    </div>
                    <Tag severity="secondary">{{ store.activeLeaders.length }}</Tag>
                  </div>
                  <div class="mb-3 flex items-center gap-2">
                    <Select
                      v-model="selectedLeaderId"
                      :options="leaderOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select a user to assign as leader"
                      filter
                      class="flex-1"
                    />
                    <Button
                      label="Assign"
                      icon="pi pi-plus"
                      :disabled="!selectedLeaderId"
                      :loading="store.membershipActionStatus === Status.LOADING"
                      @click="assignLeader"
                    />
                  </div>
                  <DataTable :value="store.activeLeaders" striped-rows>
                    <template #empty>
                      <LwpEmptyState title="No Leaders" description="Assign or promote members to leader." />
                    </template>
                    <Column field="full_name" header="Leader">
                      <template #body="{ data }">
                        <div class="flex items-center gap-2.5">
                          <Avatar v-if="data.profile_public_id" shape="circle" class="!h-8 !w-8 shrink-0 overflow-hidden">
                            <LwpImage :public-id="data.profile_public_id" :height="32" :width="32" class-name="w-full h-full object-cover" />
                          </Avatar>
                          <Avatar v-else :label="initials(data)" shape="circle" class="!h-8 !w-8 shrink-0 text-xs font-semibold" />
                          <div>
                            <div class="font-medium">{{ fullName(data) }}</div>
                            <div class="text-sm text-surface-500">{{ data.email }}</div>
                          </div>
                        </div>
                      </template>
                    </Column>
                    <Column field="joined_at" header="Joined">
                      <template #body="{ data }">{{ formatDateTime(data.joined_at) }}</template>
                    </Column>
                    <Column header="Actions">
                      <template #body="{ data }">
                        <Button
                          label="Remove Leader"
                          severity="danger"
                          variant="outlined"
                          size="small"
                          :loading="store.membershipActionStatus === Status.LOADING"
                          @click="removeLeader(data)"
                        />
                      </template>
                    </Column>
                  </DataTable>
                </div>

                <Divider class="my-0" />

                <!-- Active Members -->
                <div>
                  <div class="mb-3 flex items-center justify-between">
                    <div>
                      <h3 class="text-base font-semibold">Active Members</h3>
                      <p class="text-sm text-surface-500">Promote to leader or remove from the group.</p>
                    </div>
                    <Tag severity="info">{{ store.activeMembers.length }}</Tag>
                  </div>
                  <DataTable :value="store.activeMembers" striped-rows paginator :rows="10">
                    <template #empty>
                      <LwpEmptyState title="No Active Members" description="This group has no active members yet." />
                    </template>
                    <Column field="full_name" header="Member">
                      <template #body="{ data }">
                        <div class="flex items-center gap-2.5">
                          <Avatar v-if="data.profile_public_id" shape="circle" class="!h-8 !w-8 shrink-0 overflow-hidden">
                            <LwpImage :public-id="data.profile_public_id" :height="32" :width="32" class-name="w-full h-full object-cover" />
                          </Avatar>
                          <Avatar v-else :label="initials(data)" shape="circle" class="!h-8 !w-8 shrink-0 text-xs font-semibold" />
                          <div>
                            <div class="font-medium">{{ fullName(data) }}</div>
                            <div class="text-sm text-surface-500">{{ data.email }}</div>
                          </div>
                        </div>
                      </template>
                    </Column>
                    <Column field="joined_at" header="Joined">
                      <template #body="{ data }">{{ formatDateTime(data.joined_at) }}</template>
                    </Column>
                    <Column field="responded_by_full_name" header="Approved By">
                      <template #body="{ data }">{{ data.responded_by_full_name || 'N/A' }}</template>
                    </Column>
                    <Column header="Actions" style="width: 14rem">
                      <template #body="{ data }">
                        <div class="flex gap-2">
                          <Button
                            label="Promote"
                            severity="contrast"
                            variant="outlined"
                            size="small"
                            :loading="store.membershipActionStatus === Status.LOADING"
                            @click="promoteMember(data)"
                          />
                          <Button
                            label="Remove"
                            severity="danger"
                            variant="outlined"
                            size="small"
                            :loading="store.membershipActionStatus === Status.LOADING"
                            @click="removeMember(data)"
                          />
                        </div>
                      </template>
                    </Column>
                  </DataTable>
                </div>

                <Divider class="my-0" />

                <!-- Pending Requests -->
                <div>
                  <div class="mb-3 flex items-center justify-between">
                    <div>
                      <h3 class="text-base font-semibold">Pending Requests</h3>
                      <p class="text-sm text-surface-500">Review and action incoming join requests.</p>
                    </div>
                    <Tag severity="warn">{{ store.pendingMembers.length }}</Tag>
                  </div>
                  <DataTable :value="store.pendingMembers" striped-rows paginator :rows="10">
                    <template #empty>
                      <LwpEmptyState title="No Pending Requests" description="There are no pending requests right now." />
                    </template>
                    <Column field="full_name" header="Requester">
                      <template #body="{ data }">
                        <div class="flex items-center gap-2.5">
                          <Avatar v-if="data.profile_public_id" shape="circle" class="!h-8 !w-8 shrink-0 overflow-hidden">
                            <LwpImage :public-id="data.profile_public_id" :height="32" :width="32" class-name="w-full h-full object-cover" />
                          </Avatar>
                          <Avatar v-else :label="initials(data)" shape="circle" class="!h-8 !w-8 shrink-0 text-xs font-semibold" />
                          <div>
                            <div class="font-medium">{{ fullName(data) }}</div>
                            <div class="text-sm text-surface-500">{{ data.email }}</div>
                          </div>
                        </div>
                      </template>
                    </Column>
                    <Column field="requested_at" header="Requested At">
                      <template #body="{ data }">{{ formatDateTime(data.requested_at) }}</template>
                    </Column>
                    <Column header="Actions" style="width: 14rem">
                      <template #body="{ data }">
                        <div class="flex gap-2">
                          <Button
                            label="Decline"
                            severity="danger"
                            variant="outlined"
                            size="small"
                            :loading="store.membershipActionStatus === Status.LOADING"
                            @click="declineRequest(data)"
                          />
                          <Button
                            label="Approve"
                            size="small"
                            :loading="store.membershipActionStatus === Status.LOADING"
                            @click="approveRequest(data)"
                          />
                        </div>
                      </template>
                    </Column>
                  </DataTable>
                </div>

              </div>
            </TabPanel>

            <!-- ── Feed tab ─────────────────────────────────────────── -->
            <TabPanel value="feed">
              <div class="p-4">
                <LwpSkeletonTable
                  v-if="store.postsStatus === Status.LOADING"
                  :columns="1"
                  :rows="4"
                />

                <LwpEmptyState
                  v-else-if="store.postsStatus === Status.ERROR"
                  title="Could Not Load Posts"
                  description="There was an error loading the feed. Try refreshing."
                />

                <LwpEmptyState
                  v-else-if="store.posts.length === 0"
                  title="No Posts Yet"
                  description="Leaders post updates from the mobile app. Posts will appear here once published."
                />

                <div v-else>
                  <div
                    v-for="(post, index) in store.posts"
                    :key="post.id"
                    :class="[
                      'py-4',
                      index < store.posts.length - 1
                        ? 'border-b border-surface-200 dark:border-surface-700'
                        : '',
                      post.is_pinned ? 'border-l-2 border-primary-400 pl-3' : '',
                    ]"
                  >
                    <div
                      v-if="post.is_pinned"
                      class="mb-2 flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400"
                    >
                      <i class="pi pi-bookmark-fill text-xs" />
                      Pinned
                    </div>

                    <div class="flex items-start justify-between gap-3">
                      <div class="flex items-center gap-2.5">
                        <Avatar v-if="post.author_profile_public_id" shape="circle" class="!h-8 !w-8 shrink-0 overflow-hidden">
                          <LwpImage :public-id="post.author_profile_public_id" :height="32" :width="32" class-name="w-full h-full object-cover" />
                        </Avatar>
                        <Avatar v-else :label="initials({ first_name: post.author_first_name, last_name: post.author_last_name })" shape="circle" class="!h-8 !w-8 shrink-0 text-xs font-semibold" />
                        <div>
                          <div class="text-sm font-semibold leading-tight">
                            {{ post.author_full_name || [post.author_first_name, post.author_last_name].filter(Boolean).join(' ') || 'Leader' }}
                          </div>
                          <div class="text-xs text-surface-500">{{ formatDateTime(post.updated_at || post.created_at) }}</div>
                        </div>
                      </div>

                      <div class="flex shrink-0 items-center gap-2">
                        <Tag v-if="(post.reaction_count ?? 0) > 0" severity="secondary">
                          <i class="pi pi-heart mr-1 text-xs" />{{ post.reaction_count }}
                        </Tag>
                        <Button
                          :icon="post.is_pinned ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'"
                          :severity="post.is_pinned ? 'contrast' : 'secondary'"
                          variant="outlined"
                          size="small"
                          :loading="store.postActionStatus === Status.LOADING"
                          :title="post.is_pinned ? 'Unpin post' : 'Pin post'"
                          @click="pinPost(post.id, !post.is_pinned)"
                        />
                        <Button
                          icon="pi pi-trash"
                          severity="danger"
                          variant="outlined"
                          size="small"
                          :loading="store.postActionStatus === Status.LOADING"
                          title="Delete post"
                          @click="deletePost(post.id, post.title)"
                        />
                      </div>
                    </div>

                    <p v-if="post.title?.trim()" class="mt-2 text-sm font-semibold">
                      {{ post.title }}
                    </p>
                    <LwpQuillViewer :content="post.content" class="mt-1 text-sm text-surface-700 dark:text-surface-300" />
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </template>
  </PageWrapper>
</template>
