import { defineStore } from 'pinia'
import { useToast } from 'primevue/usetoast'
import { computed, ref } from 'vue'
import { Status } from '@/types/status.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { Group } from '@/types/group/group.ts'
import type { GroupMembership } from '@/types/group/group-membership.ts'
import type { GroupPost } from '@/types/group/group-post.ts'
import type { User } from '@/types/user/user.ts'
import {
  sbApproveGroupMembership,
  sbCreateConnectServeGroup,
  sbDeclineGroupMembership,
  sbDeleteConnectServeGroup,
  sbDeleteGroupPost,
  sbGetConnectServeGroup,
  sbQueryGroupMemberships,
  sbQueryConnectServeGroups,
  sbQueryGroupPosts,
  sbRemoveGroupMember,
  sbSetGroupLeader,
  sbSetGroupPostPinned,
  sbUpdateConnectServeGroup,
} from '@services/connect-serve/connect-serve-service.ts'
import { sbFetchAdminUsers } from '@services/users/users-service.ts'

export const useConnectServeStore = defineStore('connectServeStore', () => {
  const toast = useToast()
  const status = ref<Status>(Status.UNINITIALIZED)
  const modalStatus = ref<Status>(Status.OK)
  const currentGroupStatus = ref<Status>(Status.UNINITIALIZED)
  const membershipsStatus = ref<Status>(Status.UNINITIALIZED)
  const membershipActionStatus = ref<Status>(Status.OK)
  const postsStatus = ref<Status>(Status.UNINITIALIZED)
  const postActionStatus = ref<Status>(Status.OK)
  const data = ref<Group[]>([])
  const currentGroup = ref<Group | null>(null)
  const memberships = ref<GroupMembership[]>([])
  const posts = ref<GroupPost[]>([])
  const membershipCandidates = ref<User[]>([])
  const filter = ref<LwpFilter>({
    searchText: '',
  })
  const pagination = ref<LwpPagination>({
    from: 0,
    to: 19,
    limit: 20,
    count: 0,
    page: 0,
  })
  const sort = ref<LwpSort>({
    column: 'updated_at',
    order: 'desc',
  })

  const tableColumns = ref<{ header: string; field: string }[]>([
    { header: 'Banner', field: 'banner_public_id' },
    { header: 'Title', field: 'title' },
    { header: 'Description', field: 'description' },
    { header: 'Type', field: 'type' },
    { header: 'Leaders', field: 'leader_count' },
    { header: 'Members', field: 'member_count' },
    { header: 'Pending', field: 'pending_count' },
    { header: 'Whatsapp', field: 'whatsappLink' },
    { header: 'Location', field: 'location' },
    { header: 'Created At', field: 'created_at' },
    { header: 'Updated At', field: 'updated_at' },
  ])

  const initConnectServeGroups = async () => {
    status.value = Status.LOADING
    await queryConnectServeGroups()
  }

  const queryConnectServeGroups = async () => {
    status.value = Status.LOADING
    const response = await sbQueryConnectServeGroups(pagination.value, sort.value, filter.value)

    data.value = response.data
    pagination.value = {
      ...pagination.value,
      count: response.count,
      to: response.count < pagination.value.limit ? response.count : pagination.value.limit - 1,
    }
    status.value = Status.OK
  }

  const createConnectServeGroup = async (group: Group) => {
    modalStatus.value = Status.LOADING
    const response = await sbCreateConnectServeGroup(group)

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Creating Group', life: 2000 })
    } else {
      modalStatus.value = Status.OK
      toast.add({ severity: 'success', summary: 'Group Created', life: 2000 })
    }
  }

  const updateConnectServeGroup = async (group: Group) => {
    modalStatus.value = Status.LOADING
    const response = await sbUpdateConnectServeGroup(group)

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Updating Group', life: 2000 })
    } else {
      modalStatus.value = Status.OK
      toast.add({ severity: 'success', summary: 'Group Updated', life: 2000 })
    }
  }

  const deleteConnectServeGroup = async (group: Group) => {
    modalStatus.value = Status.LOADING
    const response = await sbDeleteConnectServeGroup(group)

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Deleting Group', life: 2000 })
    } else {
      modalStatus.value = Status.OK
      toast.add({ severity: 'success', summary: 'Group Deleted', life: 2000 })
    }
  }

  const loadConnectServeGroup = async (groupId: string) => {
    currentGroupStatus.value = Status.LOADING
    const response = await sbGetConnectServeGroup(groupId)

    if (response.error || !response.data) {
      currentGroup.value = null
      currentGroupStatus.value = Status.ERROR
      toast.add({
        severity: 'error',
        summary: 'Error Loading Group',
        detail: response.error?.message ?? 'Group not found.',
        life: 3000,
      })
      return
    }

    currentGroup.value = response.data
    currentGroupStatus.value = Status.OK
  }

  const loadGroupMemberships = async (groupId: string) => {
    membershipsStatus.value = Status.LOADING
    const response = await sbQueryGroupMemberships(groupId)

    if (response.error) {
      memberships.value = []
      membershipsStatus.value = Status.ERROR
      toast.add({
        severity: 'error',
        summary: 'Error Loading Memberships',
        detail: response.error.message,
        life: 3000,
      })
      return
    }

    memberships.value = response.data
    membershipsStatus.value = Status.OK
  }

  const loadMembershipCandidates = async () => {
    if (membershipCandidates.value.length > 0) return

    const response = await sbFetchAdminUsers()

    if (response.error) {
      toast.add({
        severity: 'error',
        summary: 'Error Loading Users',
        detail: response.error.message,
        life: 3000,
      })
      return
    }

    membershipCandidates.value = response.data
  }

  const refreshGroupDetail = async (groupId: string) => {
    await Promise.all([loadConnectServeGroup(groupId), loadGroupMemberships(groupId), queryConnectServeGroups()])
  }

  const approveGroupMembership = async (groupId: string, userId: string) => {
    membershipActionStatus.value = Status.LOADING
    const response = await sbApproveGroupMembership(groupId, userId)

    if (response.error) {
      membershipActionStatus.value = Status.ERROR
      toast.add({
        severity: 'error',
        summary: 'Error Approving Request',
        detail: response.error.message,
        life: 3000,
      })
      return false
    }

    membershipActionStatus.value = Status.OK
    toast.add({ severity: 'success', summary: 'Request Approved', life: 2000 })
    await refreshGroupDetail(groupId)
    return true
  }

  const declineGroupMembership = async (groupId: string, userId: string) => {
    membershipActionStatus.value = Status.LOADING
    const response = await sbDeclineGroupMembership(groupId, userId)

    if (response.error) {
      membershipActionStatus.value = Status.ERROR
      toast.add({
        severity: 'error',
        summary: 'Error Declining Request',
        detail: response.error.message,
        life: 3000,
      })
      return false
    }

    membershipActionStatus.value = Status.OK
    toast.add({ severity: 'success', summary: 'Request Declined', life: 2000 })
    await refreshGroupDetail(groupId)
    return true
  }

  const removeGroupMember = async (groupId: string, userId: string) => {
    membershipActionStatus.value = Status.LOADING
    const response = await sbRemoveGroupMember(groupId, userId)

    if (response.error) {
      membershipActionStatus.value = Status.ERROR
      toast.add({
        severity: 'error',
        summary: 'Error Removing Member',
        detail: response.error.message,
        life: 3000,
      })
      return false
    }

    membershipActionStatus.value = Status.OK
    toast.add({ severity: 'success', summary: 'Member Removed', life: 2000 })
    await refreshGroupDetail(groupId)
    return true
  }

  const setGroupLeader = async (groupId: string, userId: string, shouldBeLeader: boolean) => {
    membershipActionStatus.value = Status.LOADING
    const response = await sbSetGroupLeader(groupId, userId, shouldBeLeader)

    if (response.error) {
      membershipActionStatus.value = Status.ERROR
      toast.add({
        severity: 'error',
        summary: shouldBeLeader ? 'Error Assigning Leader' : 'Error Removing Leader',
        detail: response.error.message,
        life: 3000,
      })
      return false
    }

    membershipActionStatus.value = Status.OK
    toast.add({
      severity: 'success',
      summary: shouldBeLeader ? 'Leader Assigned' : 'Leader Removed',
      life: 2000,
    })
    await refreshGroupDetail(groupId)
    return true
  }

  const loadGroupPosts = async (groupId: string) => {
    postsStatus.value = Status.LOADING
    const response = await sbQueryGroupPosts(groupId)

    if (response.error) {
      postsStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Loading Posts', detail: response.error.message, life: 3000 })
      return
    }

    posts.value = response.data
    postsStatus.value = Status.OK
  }

  const pinGroupPost = async (groupId: string, postId: string, shouldPin: boolean) => {
    postActionStatus.value = Status.LOADING
    const response = await sbSetGroupPostPinned(postId, shouldPin)

    if (response.error) {
      postActionStatus.value = Status.ERROR
      toast.add({
        severity: 'error',
        summary: shouldPin ? 'Error Pinning Post' : 'Error Unpinning Post',
        detail: response.error.message,
        life: 3000,
      })
      return
    }

    postActionStatus.value = Status.OK
    toast.add({ severity: 'success', summary: shouldPin ? 'Post Pinned' : 'Post Unpinned', life: 2000 })
    await loadGroupPosts(groupId)
  }

  const removeGroupPost = async (groupId: string, postId: string) => {
    postActionStatus.value = Status.LOADING
    const response = await sbDeleteGroupPost(postId)

    if (response.error) {
      postActionStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Deleting Post', detail: response.error.message, life: 3000 })
      return
    }

    postActionStatus.value = Status.OK
    toast.add({ severity: 'success', summary: 'Post Deleted', life: 2000 })
    await loadGroupPosts(groupId)
  }

  const pageConnectServeGroups = async (updatedPagination: LwpPagination) => {
    pagination.value = updatedPagination
    await queryConnectServeGroups()
  }

  const sortConnectServeGroups = async (updatedSort: LwpSort) => {
    sort.value = updatedSort
    await queryConnectServeGroups()
  }

  const filterConnectServeGroups = async (updatedFilter: LwpFilter) => {
    filter.value = updatedFilter
    pagination.value = {
      from: 0,
      to: 19,
      limit: 20,
      count: 0,
      page: 0,
    }
    await queryConnectServeGroups()
  }

  const activeLeaders = computed(() =>
    memberships.value.filter(
      (membership) => membership.role === 'leader' && membership.status === 'active',
    ),
  )

  const activeMembers = computed(() =>
    memberships.value.filter(
      (membership) => membership.role === 'member' && membership.status === 'active',
    ),
  )

  const pendingMembers = computed(() =>
    memberships.value.filter((membership) => membership.status === 'pending'),
  )

  return {
    status,
    modalStatus,
    currentGroupStatus,
    membershipsStatus,
    membershipActionStatus,
    postsStatus,
    postActionStatus,
    data,
    currentGroup,
    memberships,
    posts,
    membershipCandidates,
    filter,
    sort,
    pagination,
    tableColumns,
    activeLeaders,
    activeMembers,
    pendingMembers,
    initConnectServeGroups,
    queryConnectServeGroups,
    createConnectServeGroup,
    updateConnectServeGroup,
    deleteConnectServeGroup,
    loadConnectServeGroup,
    loadGroupMemberships,
    loadMembershipCandidates,
    loadGroupPosts,
    approveGroupMembership,
    declineGroupMembership,
    removeGroupMember,
    setGroupLeader,
    pinGroupPost,
    removeGroupPost,
    pageConnectServeGroups,
    sortConnectServeGroups,
    filterConnectServeGroups,
  }
})
