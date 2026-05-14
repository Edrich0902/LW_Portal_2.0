<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import type { FormSubmitEvent } from '@primevue/forms/form'
import { useToast } from 'primevue/usetoast'
import { yupResolver } from '@primeuix/forms/resolvers/yup'
import * as yup from 'yup'
import { Status } from '@/types/status.ts'
import { useConfirm } from 'primevue'
import type { Roleplayer } from '@/types/roleplayer/roleplayer.ts'
import { useRoleplayersStore } from '@stores/roleplayers/roleplayers.store.ts'

const toast = useToast()
const confirm = useConfirm()
const store = useRoleplayersStore()

const props = withDefaults(
  defineProps<{
    visible: boolean
    roleplayer?: Roleplayer
  }>(),
  {
    roleplayer: undefined,
  },
)

let initialValues: Partial<Roleplayer> = {}
const isReady = ref(false)
const profilePublicId = ref<string | undefined>(props.roleplayer?.profile_public_id)
const profileUrl = ref<string | undefined>(props.roleplayer?.profile_url)

onBeforeMount(() => {
  initialValues = {
    fullname: props.roleplayer?.fullname ?? '',
    title: props.roleplayer?.title ?? '',
    bio: props.roleplayer?.bio ?? '',
  }

  isReady.value = true
})

const resolver = ref(
  yupResolver(
    yup.object().shape({
      fullname: yup.string().required('Full name is required'),
      title: yup.string().required('Title is required'),
      bio: yup.string().nullable(),
    }),
  ),
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close', value: boolean): void
}>()

const model = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
})

const modalTitle = computed(() => {
  return props.roleplayer && props.roleplayer.id ? 'Update Roleplayer' : 'Create Roleplayer'
})

const isUpdating = computed(() => {
  return props.roleplayer && props.roleplayer.id
})

const closeAndResetModal = (shouldRefresh: boolean = false) => {
  model.value = false
  emit('close', shouldRefresh)
}

const onFormSubmit = async ({ valid, values }: FormSubmitEvent<Roleplayer>) => {
  if (!valid) {
    toast.add({ severity: 'error', summary: 'Some inputs are invalid', life: 2000 })
    return
  }

  const payload = {
    ...props.roleplayer,
    ...values,
    profile_public_id: profilePublicId.value,
    profile_url: profileUrl.value,
  }

  if (isUpdating.value) {
    await store.updateRoleplayer(payload as Roleplayer)
  } else {
    await store.createRoleplayer(payload as Roleplayer)
  }

  if (store.modalStatus === Status.OK) {
    closeAndResetModal(true)
  }
}

const onUpload = (info: any) => {
  profilePublicId.value = info.public_id
  profileUrl.value = info.secure_url
  toast.add({ severity: 'success', summary: 'Image uploaded', life: 2000 })
}

const attemptDelete = (event: MouseEvent) => {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: 'Are you sure you want to delete this Roleplayer?',
    icon: 'pi pi-info-circle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger',
    },
    accept: async () => {
      await store.deleteRoleplayer(props.roleplayer!)

      if (store.modalStatus === Status.OK) {
        closeAndResetModal(true)
      }
    },
  })
}
</script>

<template>
  <Dialog v-model:visible="model" modal :header="modalTitle" class="w-1/3">
    <div class="flex flex-col items-center gap-4 mb-6">
      <LwpImage
        :public-id="profilePublicId"
        :height="200"
        :width="200"
        class-name="w-40 h-40 object-cover rounded-full shadow-lg border-4 border-white dark:border-gray-800"
      />
      <LwpImageUploader label="Change Profile Picture" @uploaded="onUpload" />
    </div>

    <Form
      v-if="isReady"
      @submit="onFormSubmit"
      :initialValues="initialValues"
      :resolver
      validate-on-value-update
      class="flex flex-col w-full items-center gap-3 p-2"
    >
      <FormField name="fullname" #default="slotProps" class="w-full">
        <FloatLabel variant="on">
          <InputText v-model="slotProps.value" type="text" fluid />
          <label for="fullname">Full Name</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
          slotProps.error?.message
        }}</Message>
      </FormField>

      <FormField name="title" #default="slotProps" class="w-full">
        <FloatLabel variant="on">
          <InputText v-model="slotProps.value" type="text" fluid />
          <label for="title">Title (e.g. Pastor, Elder)</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
          slotProps.error?.message
        }}</Message>
      </FormField>

      <FormField name="bio" #default="slotProps" class="w-full">
        <FloatLabel variant="on">
          <Textarea v-model="slotProps.value" rows="3" fluid autoResize />
          <label for="bio">Bio</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
          slotProps.error?.message
        }}</Message>
      </FormField>

      <div class="flex items-center justify-between w-full mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div>
          <Button
            v-if="isUpdating"
            label="Delete"
            severity="danger"
            variant="text"
            @click="attemptDelete"
          />
        </div>
        <div class="flex gap-3">
          <Button label="Cancel" variant="outlined" severity="secondary" @click="closeAndResetModal()" />
          <Button
            :label="isUpdating ? 'Update' : 'Create'"
            type="submit"
            :loading="store.modalStatus === Status.LOADING"
          />
        </div>
      </div>
    </Form>
  </Dialog>
</template>
