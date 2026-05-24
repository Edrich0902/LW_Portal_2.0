import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { Status } from '@/types/status.ts'
import type { Role } from '@/types/role/role.ts'
import { sbCreateRole, sbQueryRoles } from '@services/roles/roles-service.ts'

export const useRolesStore = defineStore('rolesStore', () => {
  const toast = useToast()
  const status = ref<Status>(Status.UNINITIALIZED)
  const modalStatus = ref<Status>(Status.OK)
  const data = ref<Role[]>([])

  const initRoles = async () => {
    status.value = Status.LOADING
    await queryRoles()
  }

  const queryRoles = async () => {
    status.value = Status.LOADING
    const response = await sbQueryRoles()

    if (response.error) {
      data.value = []
      status.value = Status.ERROR
      toast.add({
        severity: 'error',
        summary: 'Error Loading Roles',
        detail: response.error.message,
        life: 3000,
      })
      return
    }

    data.value = response.data
    status.value = Status.OK
  }

  const createRole = async (roleName: string) => {
    modalStatus.value = Status.LOADING
    const response = await sbCreateRole(roleName)

    if (response.error) {
      modalStatus.value = Status.ERROR
      toast.add({
        severity: 'error',
        summary: 'Error Creating Role',
        detail: response.error.message,
        life: 3000,
      })
      return
    }

    modalStatus.value = Status.OK
    toast.add({ severity: 'success', summary: 'Role Created', life: 2000 })
  }

  return {
    status,
    modalStatus,
    data,
    initRoles,
    queryRoles,
    createRole,
  }
})
