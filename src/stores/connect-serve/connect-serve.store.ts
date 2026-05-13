import { defineStore } from 'pinia'
import { useToast } from 'primevue/usetoast'
import { ref } from 'vue'
import { Status } from '@/types/status.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { Group } from '@/types/group/group.ts'
import {
  sbCreateConnectServeGroup,
  sbDeleteConnectServeGroup,
  sbQueryConnectServeGroups,
  sbUpdateConnectServeGroup,
} from '@services/connect-serve/connect-serve-service.ts'

export const useConnectServeStore = defineStore('connectServeStore', () => {
  const toast = useToast()
  const status = ref<Status>(Status.UNINITIALIZED)
  const modalStatus = ref<Status>(Status.OK)
  const data = ref<Group[]>([])
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

  return {
    status,
    modalStatus,
    data,
    filter,
    sort,
    pagination,
    tableColumns,
    initConnectServeGroups,
    queryConnectServeGroups,
    createConnectServeGroup,
    updateConnectServeGroup,
    deleteConnectServeGroup,
    pageConnectServeGroups,
    sortConnectServeGroups,
    filterConnectServeGroups,
  }
})
