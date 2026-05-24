<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { Status } from '@/types/status.ts'
import type { User } from '@/types/user/user.ts'
import { useUsersStore } from '@stores/users/users.store.ts'
import { useRolesStore } from '@stores/roles/roles.store.ts'
import { useAuthStore } from '@stores/auth/auth.store.ts'
import LwpImage from '@components/lwp-image/LwpImage.vue'
import { formatRoleLabel } from '@lib/role.utils.ts'

const router = useRouter()
const toast = useToast()
const usersStore = useUsersStore()
const rolesStore = useRolesStore()
const authStore = useAuthStore()

const props = withDefaults(
  defineProps<{
    visible: boolean
    user?: User
  }>(),
  {
    user: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close', value: boolean): void
}>()

const selectedRoleId = ref<string | undefined>(props.user?.role_id)

onBeforeMount(async () => {
  if (rolesStore.status === Status.UNINITIALIZED) {
    await rolesStore.initRoles()
  }
})

const model = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
})

const fullName = computed(() => {
  return [props.user?.first_name, props.user?.last_name].filter(Boolean).join(' ') || 'Unknown User'
})

const selectedRole = computed(() => {
  return rolesStore.data.find((role) => role.id === selectedRoleId.value)
})

const roleOptions = computed(() => {
  return rolesStore.data.map((role) => ({
    label: formatRoleLabel(role.role),
    value: role.id,
  }))
})

const closeAndResetModal = (shouldRefresh = false) => {
  selectedRoleId.value = props.user?.role_id
  model.value = false
  emit('close', shouldRefresh)
}

const saveRole = async () => {
  if (!props.user?.id || !selectedRoleId.value) {
    toast.add({
      severity: 'error',
      summary: 'Role Required',
      detail: 'Select a role before saving.',
      life: 2500,
    })
    return
  }

  const success = await usersStore.updateUserRole(props.user.id, selectedRoleId.value)
  if (!success) return

  if (authStore.user?.id === props.user.id) {
    await authStore.initialise()

    if (!authStore.authed) {
      await router.replace('/')
      closeAndResetModal(false)
      return
    }
  }

  closeAndResetModal(true)
}
</script>

<template>
  <Dialog v-model:visible="model" modal header="Update User Role" class="w-full max-w-xl">
    <div class="flex flex-col gap-5 p-2">
      <div class="flex items-center gap-4">
        <LwpImage
          :public-id="props.user?.profile_public_id"
          :height="80"
          :width="80"
          class-name="w-20 h-20 object-cover rounded-full shadow-sm"
        />
        <div class="min-w-0 flex-1">
          <div class="text-lg font-semibold">{{ fullName }}</div>
          <div class="truncate text-sm text-surface-500">{{ props.user?.email }}</div>
          <div class="mt-2">
            <Tag severity="secondary">Current: {{ formatRoleLabel(props.user?.role) }}</Tag>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label for="role" class="text-sm font-medium">Role</label>
        <Select
          v-model="selectedRoleId"
          input-id="role"
          :options="roleOptions"
          option-label="label"
          option-value="value"
          placeholder="Select a role"
          fluid
        />
      </div>

      <div v-if="selectedRole" class="rounded-xl border border-surface-200 p-3 text-sm">
        Selected role: <span class="font-medium">{{ formatRoleLabel(selectedRole.role) }}</span>
      </div>

      <div class="flex justify-end gap-3 border-t border-surface-200 pt-4">
        <Button label="Cancel" variant="outlined" severity="secondary" @click="closeAndResetModal()" />
        <Button label="Save" :loading="usersStore.modalStatus === Status.LOADING" @click="saveRole" />
      </div>
    </div>
  </Dialog>
</template>
