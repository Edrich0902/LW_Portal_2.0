import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type User } from '@/types/user/user.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import { Status } from '@/types/status.ts'
import { useToast } from 'primevue/usetoast'
import { formatRoleLabel } from '@lib/role.utils.ts'
import { sbFetchAdminUsers, sbSetUserRole } from '@services/users/users-service.ts'

export const useUsersStore = defineStore('usersStore', () => {
  const toast = useToast()
  const status = ref<Status>(Status.UNINITIALIZED)
  const modalStatus = ref<Status>(Status.OK)
  const rawData = ref<User[]>([])
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
    const response = await sbFetchAdminUsers()

    if (response.error) {
      rawData.value = []
      data.value = []
      status.value = Status.ERROR
      toast.add({
        severity: 'error',
        summary: 'Error Loading Users',
        detail: response.error.message,
        life: 3000,
      })
      return
    }

    rawData.value = response.data
    applyViewState()
    status.value = Status.OK
  }

  const queryUsers = async () => {
    status.value = Status.LOADING
    applyViewState()
    status.value = Status.OK
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
    filter.value = updatedFilter
    pagination.value = {
      from: 0,
      to: 19,
      limit: 20,
      count: 0,
      page: 0,
    }
    await queryUsers()
  }

  const updateUserRole = async (userId: string, roleId: string) => {
    modalStatus.value = Status.LOADING
    const response = await sbSetUserRole(userId, roleId)

    if (response.error) {
      modalStatus.value = Status.ERROR
      toast.add({
        severity: 'error',
        summary: 'Error Updating User Role',
        detail: response.error.message,
        life: 3000,
      })
      return false
    }

    modalStatus.value = Status.OK
    toast.add({ severity: 'success', summary: 'User Role Updated', life: 2000 })
    return true
  }

  const applyViewState = () => {
    const trimmedSearch = filter.value.searchText.trim().toLowerCase()
    const filtered = rawData.value.filter((user) => {
      if (!trimmedSearch) return true

      const haystack = [
        user.first_name,
        user.last_name,
        user.email,
        user.address,
        user.role,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(trimmedSearch)
    })

    userCounts.value = {
      members: rawData.value.filter((user) => user.is_member === true).length,
      nonMembers: rawData.value.filter((user) => user.is_member === false).length,
      baptized: rawData.value.filter((user) => user.is_baptized === true).length,
      nonBaptized: rawData.value.filter((user) => user.is_baptized === false).length,
    }

    const sorted = [...filtered].sort((left, right) => sortUsersByColumn(left, right, sort.value))
    const count = sorted.length
    const from = Math.min(pagination.value.from, Math.max(count - 1, 0))
    const to = Math.min(from + pagination.value.limit - 1, Math.max(count - 1, 0))

    data.value = count === 0 ? [] : sorted.slice(from, to + 1)
    pagination.value = {
      ...pagination.value,
      from: count === 0 ? 0 : from,
      to: count === 0 ? 0 : to,
      count,
    }
  }

  return {
    status,
    modalStatus,
    data,
    userCounts,
    filter,
    sort,
    pagination,
    tableColumns,
    initUsers,
    queryUsers,
    pageUsers,
    sortUsers,
    filterUsers,
    updateUserRole,
  }
})

const sortUsersByColumn = (left: User, right: User, sort: LwpSort) => {
  const direction = sort.order === 'asc' ? 1 : -1
  const leftValue = getSortableValue(left, sort.column)
  const rightValue = getSortableValue(right, sort.column)

  if (leftValue < rightValue) return -1 * direction
  if (leftValue > rightValue) return 1 * direction
  return 0
}

const getSortableValue = (user: User, column: string) => {
  const value = user[column as keyof User]

  if (typeof value === 'boolean') return value ? 1 : 0
  if (column === 'role') return formatRoleLabel(user.role).toLowerCase()
  return String(value ?? '').toLowerCase()
}
