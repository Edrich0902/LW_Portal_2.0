import { defineStore } from 'pinia'
import { useToast } from 'primevue/usetoast'
import { ref } from 'vue'
import { Status } from '@/types/status.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { Group } from '@/types/group/group.ts'
import { sbQueryConnectServeGroups } from '@services/connect-serve/connect-serve-service.ts'

export const useConnectServeStore = defineStore('connectServeStore', () => {
  const toast = useToast()
  const status = ref<Status>(Status.UNINITIALIZED)
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
    data,
    filter,
    sort,
    pagination,
    tableColumns,
    initConnectServeGroups,
    queryConnectServeGroups,
    pageConnectServeGroups,
    sortConnectServeGroups,
    filterConnectServeGroups,
  }
})
