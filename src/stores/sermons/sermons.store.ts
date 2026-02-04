import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useToast } from 'primevue/usetoast'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import { Status } from '@/types/status.ts'
import type { Sermon } from '@/types/sermon/sermon.ts'
import { sbQuerySermons } from '@services/sermons/sermon-service.ts'

export const useSermonsStore = defineStore('sermonsStore', () => {
  const toast = useToast();
  const status = ref<Status>(Status.UNINITIALIZED);
  const data = ref<Sermon[]>([]);
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
    { header: 'Title', field: 'title' },
    { header: 'Pastor', field: 'pastor' },
    { header: 'Description', field: 'description' },
    { header: 'Created At', field: 'created_at' },
    { header: 'Updated At', field: 'updated_at' },
  ])

  const initSermons = async () => {
    status.value = Status.LOADING
    await querySermons()
  }

  const querySermons = async () => {
    status.value = Status.LOADING
    const response = await sbQuerySermons(pagination.value, sort.value, filter.value);

    data.value = response.data;
    pagination.value = {
      ...pagination.value,
      count: response.count,
      to: response.count < pagination.value.limit ? response.count : pagination.value.limit - 1,
    }
    status.value = Status.OK;
  }

  const pageSermons = async (updatedPagination: LwpPagination) => {
    pagination.value = updatedPagination
    await querySermons()
  }

  const sortSermons = async (updatedSort: LwpSort) => {
    sort.value = updatedSort
    await querySermons()
  }

  const filterSermons = async (updatedFilter: LwpFilter) => {
    filter.value = updatedFilter
    pagination.value = {
      from: 0,
      to: 19,
      limit: 20,
      count: 0,
      page: 0,
    }
    await querySermons()
  }

  return {
    status,
    data,
    filter,
    sort,
    pagination,
    tableColumns,
    initSermons,
    querySermons,
    pageSermons,
    sortSermons,
    filterSermons
  }
});
