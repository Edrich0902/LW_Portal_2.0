<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import type { FormSubmitEvent } from '@primevue/forms/form'
import { useToast } from 'primevue/usetoast'
import { yupResolver } from '@primeuix/forms/resolvers/yup'
import * as yup from 'yup'
import { Status } from '@/types/status.ts'
import { useConfirm } from 'primevue'
import type { Group } from '@/types/group/group.ts'
import { GroupType } from '@/types/groupType.ts'
import { useConnectServeStore } from '@stores/connect-serve/connect-serve.store.ts'
import LwpImage from '@components/lwp-image/LwpImage.vue'
import LwpImageUploader from '@components/lwp-image/LwpImageUploader.vue'

const toast = useToast()
const confirm = useConfirm()
const store = useConnectServeStore()

const props = withDefaults(
  defineProps<{
    visible: boolean
    group?: Group
  }>(),
  {
    group: undefined,
  },
)

let initialValues: Partial<Group> = {}
const isReady = ref(false)
const bannerPublicId = ref<string | undefined>(props.group?.banner_public_id)
const bannerUrl = ref<string | undefined>(props.group?.banner_url)

onBeforeMount(() => {
  initialValues = {
    title: props.group?.title ?? '',
    description: props.group?.description ?? '',
    type: props.group?.type ?? GroupType.CONNECT,
    whatsappLink: props.group?.whatsappLink ?? '',
    location: props.group?.location ?? '',
  }

  isReady.value = true
})

const resolver = ref(
  yupResolver(
    yup.object().shape({
      title: yup.string().required('Title is required'),
      description: yup.string().required('Description is required'),
      type: yup.string().required('Type is required'),
      whatsappLink: yup.string().url('Must be a valid URL').nullable(),
      location: yup.string().nullable(),
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
  return props.group && props.group.id ? 'Update Connect & Serve Group' : 'Create Connect & Serve Group'
})

const isUpdating = computed(() => {
  return props.group && props.group.id
})

const closeAndResetModal = (shouldRefresh: boolean = false) => {
  model.value = false
  emit('close', shouldRefresh)
}

const onFormSubmit = async ({ valid, values }: FormSubmitEvent<Group>) => {
  if (!valid) {
    toast.add({ severity: 'error', summary: 'Some inputs are invalid', life: 2000 })
    return
  }

  const payload = {
    ...props.group,
    ...values,
    banner_public_id: bannerPublicId.value,
    banner_url: bannerUrl.value,
  }

  if (isUpdating.value) {
    await store.updateConnectServeGroup(payload as Group)
  } else {
    await store.createConnectServeGroup(payload as Group)
  }

  if (store.modalStatus === Status.OK) {
    closeAndResetModal(true)
  }
}

const onUpload = (info: any) => {
  bannerPublicId.value = info.public_id
  bannerUrl.value = info.secure_url
  toast.add({ severity: 'success', summary: 'Image uploaded', life: 2000 })
}

const attemptDelete = (event: MouseEvent) => {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: 'Are you sure you want to delete this Group?',
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
      await store.deleteConnectServeGroup(props.group!)

      if (store.modalStatus === Status.OK) {
        closeAndResetModal(true)
      }
    },
  })
}

const groupTypes = ref([
  { label: 'Connect Group', value: GroupType.CONNECT },
  { label: 'Serve Team', value: GroupType.SERVE },
])
</script>

<template>
  <Dialog v-model:visible="model" modal :header="modalTitle" class="w-1/3">
    <div class="flex flex-col items-center gap-3 mb-4">
      <LwpImage
        :public-id="bannerPublicId"
        :height="200"
        :width="400"
        class-name="object-cover w-full h-48 rounded-lg shadow-md"
      />
      <LwpImageUploader label="Upload Banner Image" @uploaded="onUpload" />
    </div>

    <Form
      v-if="isReady"
      @submit="onFormSubmit"
      :initialValues="initialValues"
      :resolver
      validate-on-value-update
      class="flex flex-col w-full items-center gap-3 p-2"
    >
      <FormField name="title" #default="slotProps" class="w-full">
        <FloatLabel variant="on">
          <InputText v-model="slotProps.value" type="text" fluid />
          <label for="title">Title</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
          slotProps.error?.message
        }}</Message>
      </FormField>

      <FormField name="type" #default="slotProps" class="w-full">
        <FloatLabel variant="on">
          <Select
            v-model="slotProps.value"
            :options="groupTypes"
            optionLabel="label"
            optionValue="value"
            placeholder="Select Type"
            fluid
          />
          <label for="type">Type</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
          slotProps.error?.message
        }}</Message>
      </FormField>

      <FormField name="description" #default="slotProps" class="w-full">
        <FloatLabel variant="on">
          <Textarea v-model="slotProps.value" rows="3" fluid autoResize />
          <label for="description">Description</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
          slotProps.error?.message
        }}</Message>
      </FormField>

      <FormField name="whatsappLink" #default="slotProps" class="w-full">
        <FloatLabel variant="on">
          <InputText v-model="slotProps.value" type="text" fluid />
          <label for="whatsappLink">Whatsapp Link</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
          slotProps.error?.message
        }}</Message>
      </FormField>

      <FormField name="location" #default="slotProps" class="w-full">
        <FloatLabel variant="on">
          <InputText v-model="slotProps.value" type="text" fluid />
          <label for="location">Location</label>
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
