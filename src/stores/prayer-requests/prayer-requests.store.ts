import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Status } from '@/types/status.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { PrayerRequest, PrayerRequestStatus } from '@/types/prayer-request/prayer-request.ts'
import type { PrayerRequestNote } from '@/types/prayer-request/prayer-request-note.ts'
import {
  buildModerationPayload,
  sbGetPrayerRequestCounts,
  sbQueryPrayerRequests,
  sbUpdatePrayerRequest,
  sbFetchPrayerRequestNotes,
  sbAddPrayerRequestNote,
  sbDeletePrayerRequestNote,
  sbTogglePrayerRequestPrivate,
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
    isPrivate: string
  }>({
    searchText: '',
    status: '',
    category: '',
    isPrivate: '',
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
    { header: 'Private', field: 'is_private', sortable: true },
    { header: 'Status', field: 'status', sortable: true },
    { header: 'Prayer Count', field: 'reaction_count', sortable: true },
    { header: 'Created At', field: 'created_at', sortable: true },
    { header: 'Updated At', field: 'updated_at', sortable: true },
  ])

  const notes = ref<PrayerRequestNote[]>([])
  const notesStatus = ref<Status>(Status.UNINITIALIZED)
  const notesActionStatus = ref<Status>(Status.OK)

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

  const togglePrivate = async (id: string, isPrivate: boolean) => {
    modalStatus.value = Status.LOADING
    const response = await sbTogglePrayerRequestPrivate(id, isPrivate)

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Updating Prayer Request', life: 2000 })
      return
    }

    const idx = data.value.findIndex((r) => r.id === id)
    if (idx !== -1) {
      data.value[idx] = { ...data.value[idx], is_private: isPrivate }
    }

    modalStatus.value = Status.OK
    toast.add({
      severity: 'success',
      summary: isPrivate ? 'Marked as Private' : 'Marked as Public',
      life: 2000,
    })
  }

  const fetchNotes = async (prayerRequestId: string) => {
    notesStatus.value = Status.LOADING
    const response = await sbFetchPrayerRequestNotes(prayerRequestId)

    if (response.error) {
      notes.value = []
      notesStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Loading Notes', life: 2000 })
      return
    }

    notes.value = response.data
    notesStatus.value = Status.OK
  }

  const addNote = async (prayerRequestId: string, body: string) => {
    const currentUserId = auth.user?.id
    if (!currentUserId) return

    notesActionStatus.value = Status.LOADING
    const response = await sbAddPrayerRequestNote(prayerRequestId, body, currentUserId)

    if (response.error) {
      notesActionStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Adding Note', life: 2000 })
      return
    }

    toast.add({ severity: 'success', summary: 'Note Added', life: 2000 })
    await fetchNotes(prayerRequestId)
    notesActionStatus.value = Status.OK
  }

  const deleteNote = async (noteId: string, prayerRequestId: string) => {
    notesActionStatus.value = Status.LOADING
    const response = await sbDeletePrayerRequestNote(noteId)

    if (response.error) {
      notesActionStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Deleting Note', life: 2000 })
      return
    }

    toast.add({ severity: 'success', summary: 'Note Deleted', life: 2000 })
    await fetchNotes(prayerRequestId)
    notesActionStatus.value = Status.OK
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
    isPrivate: string
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
    notes,
    notesStatus,
    notesActionStatus,
    initPrayerRequests,
    fetchCounts,
    queryPrayerRequests,
    moderatePrayerRequest,
    togglePrivate,
    fetchNotes,
    addNote,
    deleteNote,
    pagePrayerRequests,
    sortPrayerRequests,
    filterPrayerRequests,
  }
})
