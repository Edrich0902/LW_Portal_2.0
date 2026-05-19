<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { type Announcement, AnnouncementState } from '@/types/announcement/announcement.ts'
import type { FormSubmitEvent } from '@primevue/forms/form'
import { useToast } from 'primevue/usetoast'
import { yupResolver } from '@primeuix/forms/resolvers/yup'
import * as yup from 'yup'
import { Status } from '@/types/status.ts'
import { useAnnouncementsStore } from '@stores/announcements/announcements.store.ts'
import { useConfirm } from 'primevue'
import LwpImageUploader from '@components/lwp-image/LwpImageUploader.vue'
import LwpImage from '@components/lwp-image/LwpImage.vue'

const toast = useToast()
const confirm = useConfirm()
const store = useAnnouncementsStore()

const props = withDefaults(
  defineProps<{
    visible: boolean
    announcement?: Announcement
  }>(),
  {
    announcement: undefined,
  },
)

let initialValues: Partial<Announcement> = {}
const isReady = ref(false)
const imagePublicId = ref<string | undefined>(props.announcement?.image_public_id)
const imageUrl = ref<string | undefined>(props.announcement?.image_url)

onBeforeMount(() => {
  initialValues = {
    title: props.announcement?.title ?? '',
    body: props.announcement?.body ?? '',
    state: props.announcement?.state ?? AnnouncementState.PENDING,
  }

  isReady.value = true
})

const resolver = ref(
  yupResolver(
    yup.object().shape({
      title: yup.string().required('Title is required'),
      body: yup.string().required('Body is required'),
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
  return props.announcement && props.announcement.id ? 'Update Announcement' : 'Create Announcement'
})

const isUpdating = computed(() => {
  return props.announcement && props.announcement.id
})

const closeAndResetModal = (shouldRefresh: boolean = false) => {
  model.value = false
  emit('close', shouldRefresh)
}

const onUpload = (info: { public_id: string; secure_url: string }) => {
  imagePublicId.value = info.public_id
  imageUrl.value = info.secure_url
  toast.add({ severity: 'success', summary: 'Image uploaded', life: 2000 })
}

const onFormSubmit = async ({ valid, values }: FormSubmitEvent<Announcement>) => {
  if (!valid) {
    toast.add({ severity: 'error', summary: 'Some inputs are invalid', life: 2000 })
    return
  }

  const payload = {
    ...props.announcement,
    ...values,
    image_public_id: imagePublicId.value,
    image_url: imageUrl.value,
  }
  
  if (isUpdating.value) {
    await store.updateAnnouncement(payload as Announcement)
  } else {
    await store.createAnnouncement({ ...payload, state: AnnouncementState.PENDING } as Announcement)
  }

  if (store.modalStatus === Status.OK) {
    closeAndResetModal(true)
  }
}

const attemptDelete = (event: MouseEvent) => {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: 'Are you sure you want to delete this Announcement?',
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
      await store.deleteAnnouncement(props.announcement!)

      if (store.modalStatus === Status.OK) {
        closeAndResetModal(true)
      }
    },
  })
}
</script>

<template>
  <Dialog v-model:visible="model" modal :header="modalTitle" class="w-1/3">
    <div class="flex flex-col items-center gap-3 mb-4">
      <div class="w-full h-40 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <LwpImage
          :public-id="imagePublicId"
          :height="300"
          class-name="object-cover w-full h-full"
        />
      </div>
      <LwpImageUploader label="Upload Announcement Image" @uploaded="onUpload" />
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

      <FormField name="body" #default="slotProps" class="w-full">
        <FloatLabel variant="on">
          <Textarea v-model="slotProps.value" rows="5" fluid autoResize />
          <label for="body">Body</label>
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
