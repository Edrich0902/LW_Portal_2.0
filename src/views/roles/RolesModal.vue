<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FormSubmitEvent } from '@primevue/forms/form'
import { yupResolver } from '@primeuix/forms/resolvers/yup'
import * as yup from 'yup'
import { useToast } from 'primevue/usetoast'
import { Status } from '@/types/status.ts'
import { formatRoleLabel, normalizeRoleName } from '@lib/role.utils.ts'
import { useRolesStore } from '@stores/roles/roles.store.ts'

const toast = useToast()
const store = useRolesStore()

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close', value: boolean): void
}>()

const model = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
})

const initialValues = {
  role: '',
}

const previewRole = ref('')

const resolver = yupResolver(
  yup.object({
    role: yup.string().required('Role name is required'),
  }),
)

const closeAndResetModal = (shouldRefresh = false) => {
  previewRole.value = ''
  model.value = false
  emit('close', shouldRefresh)
}

const onFormSubmit = async ({ valid, values }: FormSubmitEvent) => {
  if (!valid) {
    toast.add({ severity: 'error', summary: 'Some inputs are invalid', life: 2000 })
    return
  }

  await store.createRole(String(values.role ?? ''))

  if (store.modalStatus === Status.OK) {
    closeAndResetModal(true)
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) previewRole.value = ''
  },
)
</script>

<template>
  <Dialog v-model:visible="model" modal header="Create Role" class="w-full max-w-lg mx-4">
    <Form
      @submit="onFormSubmit"
      :initialValues="initialValues"
      :resolver="resolver"
      validate-on-value-update
      class="flex flex-col w-full gap-4 p-2"
    >
      <FormField name="role" #default="slotProps">
        <FloatLabel variant="on">
          <InputText
            v-model="slotProps.value"
            type="text"
            fluid
            @update:model-value="previewRole = normalizeRoleName(slotProps.value)"
          />
          <label for="role">Role Name</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">
          {{ slotProps.error?.message }}
        </Message>
      </FormField>

      <div class="rounded-xl border border-surface-200 p-3 text-sm">
        <div class="font-medium">Preview</div>
        <div class="mt-2 flex items-center gap-2">
          <Tag severity="secondary">{{ previewRole || 'role_name' }}</Tag>
          <span class="text-surface-500">{{ formatRoleLabel(previewRole) }}</span>
        </div>
      </div>

      <div class="flex justify-end gap-3 border-t border-surface-200 pt-4">
        <Button label="Cancel" variant="outlined" severity="secondary" @click="closeAndResetModal()" />
        <Button label="Create" type="submit" :loading="store.modalStatus === Status.LOADING" />
      </div>
    </Form>
  </Dialog>
</template>
