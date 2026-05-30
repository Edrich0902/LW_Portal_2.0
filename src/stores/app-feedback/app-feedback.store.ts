import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Status } from '@/types/status.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import {
  FeedbackStatus,
  type AppFeedback,
  type AppFeedbackFilter,
} from '@/types/app-feedback/app-feedback.ts'
import {
  buildFeedbackUpdatePayload,
  sbGetAppFeedbackCounts,
  sbQueryAppFeedback,
  sbUpdateAppFeedback,
} from '@services/app-feedback/app-feedback-service.ts'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@stores/auth/auth.store.ts'

export const useAppFeedbackStore = defineStore('appFeedbackStore', () => {
  const toast = useToast()
  const auth = useAuthStore()

  const status = ref<Status>(Status.UNINITIALIZED)
  const modalStatus = ref<Status>(Status.OK)

  const data = ref<AppFeedback[]>([])

  const counts = ref<Record<FeedbackStatus, number>>({
    [FeedbackStatus.OPEN]: 0,
    [FeedbackStatus.UNDER_REVIEW]: 0,
    [FeedbackStatus.PLANNED]: 0,
    [FeedbackStatus.RESOLVED]: 0,
    [FeedbackStatus.CLOSED]: 0,
  })

  const filter = ref<AppFeedbackFilter>({
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
    { header: 'Title', field: 'title', sortable: true },
    { header: 'User', field: 'first_name', sortable: true },
    { header: 'Category', field: 'category', sortable: true },
    { header: 'Status', field: 'status', sortable: true },
    { header: 'App Version', field: 'app_version', sortable: true },
    { header: 'Created At', field: 'created_at', sortable: true },
  ])

  const initAppFeedback = async () => {
    status.value = Status.LOADING
    await Promise.all([queryAppFeedback(), fetchCounts()])
  }

  const fetchCounts = async () => {
    counts.value = await sbGetAppFeedbackCounts()
  }

  const queryAppFeedback = async () => {
    status.value = Status.LOADING
    const response = await sbQueryAppFeedback(pagination.value, sort.value, filter.value)
    data.value = response.data
    pagination.value = {
      ...pagination.value,
      count: response.count,
      to: response.count < pagination.value.limit ? response.count : pagination.value.limit - 1,
    }
    status.value = Status.OK
  }

  const updateAppFeedback = async (
    feedback: AppFeedback,
    nextStatus: FeedbackStatus,
    adminNote?: string,
  ) => {
    modalStatus.value = Status.LOADING
    const currentUserId = auth.user?.id

    if (!currentUserId) {
      modalStatus.value = Status.ERROR
      return
    }

    const payload = buildFeedbackUpdatePayload(feedback, nextStatus, currentUserId, adminNote)
    const response = await sbUpdateAppFeedback(payload)

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error updating feedback', life: 2000 })
      return
    }

    modalStatus.value = Status.OK
    toast.add({ severity: 'success', summary: `Feedback marked as ${nextStatus}`, life: 2000 })

    await Promise.all([queryAppFeedback(), fetchCounts()])
  }

  const pageAppFeedback = async (updatedPagination: LwpPagination) => {
    pagination.value = updatedPagination
    await queryAppFeedback()
  }

  const sortAppFeedback = async (updatedSort: LwpSort) => {
    sort.value = updatedSort
    await queryAppFeedback()
  }

  const filterAppFeedback = async (updatedFilter: AppFeedbackFilter) => {
    filter.value = updatedFilter
    pagination.value = { from: 0, to: 19, limit: 20, count: 0, page: 0 }
    await queryAppFeedback()
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
    initAppFeedback,
    fetchCounts,
    queryAppFeedback,
    updateAppFeedback,
    pageAppFeedback,
    sortAppFeedback,
    filterAppFeedback,
  }
})
