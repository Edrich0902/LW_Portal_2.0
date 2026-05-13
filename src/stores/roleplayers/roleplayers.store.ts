import { defineStore } from 'pinia'
import { useToast } from 'primevue/usetoast'
import { ref } from 'vue'
import { Status } from '@/types/status.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { Roleplayer } from '@/types/roleplayer/roleplayer.ts'
import {
  sbCreateRoleplayer,
  sbDeleteRoleplayer,
  sbQueryRoleplayers,
  sbUpdateRoleplayer,
} from '@services/roleplayers/roleplayers-service.ts'

export const useRoleplayersStore = defineStore('roleplayersStore', () => {
  const toast = useToast()
  const status = ref<Status>(Status.UNINITIALIZED)
  const modalStatus = ref<Status>(Status.OK)
  const data = ref<Roleplayer[]>([])
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
    { header: 'Profile Image', field: 'profile_public_id' },
    { header: 'Fullname', field: 'fullname' },
    { header: 'Title', field: 'title' },
    { header: 'Created At', field: 'created_at' },
    { header: 'Updated At', field: 'updated_at' },
  ])

  const initRoleplayers = async () => {
    status.value = Status.LOADING
    await queryRoleplayers()
  }

  const queryRoleplayers = async () => {
    status.value = Status.LOADING
    const response = await sbQueryRoleplayers(pagination.value, sort.value, filter.value)

    data.value = response.data;
    pagination.value = {
      ...pagination.value,
      count: response.count,
      to: response.count < pagination.value.limit ? response.count : pagination.value.limit - 1,
    }
    status.value = Status.OK
  }

  const createRoleplayer = async (roleplayer: Roleplayer) => {
    modalStatus.value = Status.LOADING
    const response = await sbCreateRoleplayer(roleplayer)

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Creating Roleplayer', life: 2000 })
    } else {
      modalStatus.value = Status.OK
      toast.add({ severity: 'success', summary: 'Roleplayer Created', life: 2000 })
    }
  }

  const updateRoleplayer = async (roleplayer: Roleplayer) => {
    modalStatus.value = Status.LOADING
    const response = await sbUpdateRoleplayer(roleplayer)

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Updating Roleplayer', life: 2000 })
    } else {
      modalStatus.value = Status.OK
      toast.add({ severity: 'success', summary: 'Roleplayer Updated', life: 2000 })
    }
  }

  const deleteRoleplayer = async (roleplayer: Roleplayer) => {
    modalStatus.value = Status.LOADING
    const response = await sbDeleteRoleplayer(roleplayer)

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Deleting Roleplayer', life: 2000 })
    } else {
      modalStatus.value = Status.OK
      toast.add({ severity: 'success', summary: 'Roleplayer Deleted', life: 2000 })
    }
  }

  const pageRoleplayers = async (updatedPagination: LwpPagination) => {
    pagination.value = updatedPagination
    await queryRoleplayers()
  }

  const sortRoleplayers = async (updatedSort: LwpSort) => {
    sort.value = updatedSort
    await queryRoleplayers()
  }

  const filterRoleplayers = async (updatedFilter: LwpFilter) => {
    filter.value = updatedFilter
    pagination.value = {
      from: 0,
      to: 19,
      limit: 20,
      count: 0,
      page: 0,
    }
    await queryRoleplayers()
  }

  return {
    status,
    modalStatus,
    data,
    filter,
    sort,
    pagination,
    tableColumns,
    initRoleplayers,
    queryRoleplayers,
    createRoleplayer,
    updateRoleplayer,
    deleteRoleplayer,
    pageRoleplayers,
    sortRoleplayers,
    filterRoleplayers,
  }
})
