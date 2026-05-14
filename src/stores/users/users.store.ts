import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type User } from '@/types/user/user.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import { Status } from '@/types/status.ts'
import { sbQueryUsers, sbGetUsersCounts } from '@services/users/users-service.ts'

export const useUsersStore = defineStore('usersStore', () => {
  const status = ref<Status>(Status.UNINITIALIZED)
  const data = ref<User[]>([])
  const userCounts = ref({
    members: 0,
    nonMembers: 0,
    baptized: 0,
    nonBaptized: 0,
  })
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

  const tableColumns = ref<{header: string, field: string}[]>([
    {header: 'Profile Image', field: 'profile_public_id'},
    {header: 'First Name', field: 'first_name'},
    {header: 'Last Name', field: 'last_name'},
    {header: 'Email', field: 'email'},
    {header: 'Role', field: 'role'},
    {header: 'Baptized', field: 'is_baptized'},
    {header: 'Member', field: 'is_member'},
    {header: 'Address', field: 'address'},
    {header: 'Created At', field: 'created_at'},
    {header: 'Updated At', field: 'updated_at'},
  ]);

  const initUsers = async () => {
    status.value = Status.LOADING
    await Promise.all([queryUsers(), fetchUserCounts()])
  }

  const fetchUserCounts = async () => {
    userCounts.value = await sbGetUsersCounts()
  }

  const queryUsers = async () => {
    status.value = Status.LOADING
    const response = await sbQueryUsers(pagination.value, sort.value, filter.value)

    data.value = response.data;
    pagination.value = {
      ...pagination.value,
      count: response.count,
      to: response.count < pagination.value.limit ? response.count : pagination.value.limit - 1,
    }
    status.value = Status.OK;
  }

  const pageUsers = async (updatedPagination: LwpPagination) => {
    pagination.value = updatedPagination;
    await queryUsers()
  }

  const sortUsers = async (updatedSort: LwpSort) => {
    sort.value = updatedSort;
    await queryUsers()
  }

  const filterUsers = async (updatedFilter: LwpFilter) => {
    filter.value = updatedFilter;
    pagination.value = {
      from: 0,
      to: 19,
      limit: 20,
      count: 0,
      page: 0,
    }
    await queryUsers()
  }

  return {
    status,
    data,
    userCounts,
    filter,
    sort,
    pagination,
    tableColumns,
    initUsers,
    fetchUserCounts,
    queryUsers,
    pageUsers,
    sortUsers,
    filterUsers
  }
})
