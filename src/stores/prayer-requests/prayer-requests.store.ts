import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Status } from '@/types/status.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { PrayerRequest, PrayerRequestStatus } from '@/types/prayer-request/prayer-request.ts'
import {
  buildModerationPayload,
  sbGetPrayerRequestCounts,
  sbQueryPrayerRequests,
  sbUpdatePrayerRequest,
} from '@services/prayer-requests/prayer-requests-service.ts'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@stores/auth/auth.store.ts'

export const usePrayerRequestsStore = defineStore('prayerRequestsStore', () => {
  const toast = useToast()
  const auth = useAuthStore()
  const status = ref<Status>(Status.UNINITIALIZED)
  const modalStatus = ref<Status>(Status.OK)
  const data = ref<PrayerRequest[]>([])
  const counts = ref({
    pending: 0,
    approved: 0,
    rejected: 0,
    resolved: 0,
  })
  const filter = ref<{
    searchText: string
    status: string
    category: string
  }>({
    searchText: '',
    status: '',
    category: '',
  })
  const pagination = ref<LwpPagination>({
    from: 0,
    to: 19,
    limit: 20,
    count: 0,
    page: 0,
  })
  const sort = ref<LwpSort>({
    column: 'created_at',
    order: 'desc',
  })
  const tableColumns = ref<{ header: string; field: string; sortable?: boolean }[]>([
    { header: 'Requester', field: 'first_name', sortable: true },
    { header: 'Email', field: 'email', sortable: true },
    { header: 'Category', field: 'category', sortable: true },
    { header: 'Anonymous', field: 'is_anonymous', sortable: true },
    { header: 'Status', field: 'status', sortable: true },
    { header: 'Prayer Count', field: 'reaction_count', sortable: true },
    { header: 'Created At', field: 'created_at', sortable: true },
    { header: 'Updated At', field: 'updated_at', sortable: true },
  ])

  const initPrayerRequests = async () => {
    status.value = Status.LOADING
    await Promise.all([queryPrayerRequests(), fetchCounts()])
  }

  const fetchCounts = async () => {
    counts.value = await sbGetPrayerRequestCounts()
  }

  const queryPrayerRequests = async () => {
    status.value = Status.LOADING
    const response = await sbQueryPrayerRequests(pagination.value, sort.value, filter.value)
    data.value = response.data
    pagination.value = {
      ...pagination.value,
      count: response.count,
      to: response.count < pagination.value.limit ? response.count : pagination.value.limit - 1,
    }
    status.value = Status.OK
  }

  const moderatePrayerRequest = async (
    prayerRequest: PrayerRequest,
    nextStatus: PrayerRequestStatus,
    moderationNote?: string,
  ) => {
    modalStatus.value = Status.LOADING
    const currentUserId = auth.user?.id

    if (!currentUserId) {
      modalStatus.value = Status.ERROR
      return
    }

    const payload = buildModerationPayload(
      prayerRequest,
      nextStatus,
      currentUserId,
      moderationNote,
    )
    const response = await sbUpdatePrayerRequest(payload)

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Updating Prayer Request', life: 2000 })
      return
    }

    modalStatus.value = Status.OK
    toast.add({
      severity: 'success',
      summary: `Prayer Request ${nextStatus}`,
      life: 2000,
    })

    await Promise.all([queryPrayerRequests(), fetchCounts()])
  }

  const pagePrayerRequests = async (updatedPagination: LwpPagination) => {
    pagination.value = updatedPagination
    await queryPrayerRequests()
  }

  const sortPrayerRequests = async (updatedSort: LwpSort) => {
    sort.value = updatedSort
    await queryPrayerRequests()
  }

  const filterPrayerRequests = async (updatedFilter: {
    searchText: string
    status: string
    category: string
  }) => {
    filter.value = updatedFilter
    pagination.value = {
      from: 0,
      to: 19,
      limit: 20,
      count: 0,
      page: 0,
    }
    await queryPrayerRequests()
  }

  return {
    status,
    modalStatus,
    data,
    counts,
    filter,
    sort,
    pagination,
    tableColumns,
    initPrayerRequests,
    fetchCounts,
    queryPrayerRequests,
    moderatePrayerRequest,
    pagePrayerRequests,
    sortPrayerRequests,
    filterPrayerRequests,
  }
})
