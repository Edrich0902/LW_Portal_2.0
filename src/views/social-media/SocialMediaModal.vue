<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import type { FormSubmitEvent } from '@primevue/forms/form'
import { useToast } from 'primevue/usetoast'
import { yupResolver } from '@primeuix/forms/resolvers/yup'
import * as yup from 'yup'
import { Status } from '@/types/status.ts'
import { useConfirm } from 'primevue'
import { type SocialMedia, SocialMediaType } from '@/types/social-media/social-media.ts'
import { useSocialMediaStore } from '@stores/social-media/social-media.store.ts'

const toast = useToast()
const confirm = useConfirm()
const store = useSocialMediaStore()

const props = withDefaults(
  defineProps<{
    visible: boolean
    socialMediaItem?: SocialMedia
  }>(),
  {
    socialMediaItem: undefined,
  },
)

let initialValues: Partial<SocialMedia> = {}
const isReady = ref(false)
const bannerPublicId = ref<string | undefined>(props.socialMediaItem?.banner_public_id)
const bannerUrl = ref<string | undefined>(props.socialMediaItem?.banner_url)

onBeforeMount(() => {
  initialValues = {
    title: props.socialMediaItem?.title ?? '',
    link: props.socialMediaItem?.link ?? '',
    type: props.socialMediaItem?.type ?? SocialMediaType.INSTAGRAM,
  }

  isReady.value = true
})

const resolver = ref(
  yupResolver(
    yup.object().shape({
      title: yup.string().required('Title is required'),
      link: yup.string().url('Must be a valid URL').required('Link is required'),
      type: yup.string().required('Type is required'),
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
  return props.socialMediaItem && props.socialMediaItem.id ? 'Update Social Media' : 'Create Social Media'
})

const isUpdating = computed(() => {
  return props.socialMediaItem && props.socialMediaItem.id
})

const closeAndResetModal = (shouldRefresh: boolean = false) => {
  model.value = false
  emit('close', shouldRefresh)
}

const onFormSubmit = async ({ valid, values }: FormSubmitEvent<SocialMedia>) => {
  if (!valid) {
    toast.add({ severity: 'error', summary: 'Some inputs are invalid', life: 2000 })
    return
  }

  const payload = {
    ...props.socialMediaItem,
    ...values,
    banner_public_id: bannerPublicId.value,
    banner_url: bannerUrl.value,
  }

  if (isUpdating.value) {
    await store.updateSocialMedia(payload as SocialMedia)
  } else {
    await store.createSocialMedia(payload as SocialMedia)
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
    message: 'Are you sure you want to delete this Social Media?',
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
      await store.deleteSocialMedia(props.socialMediaItem!)

      if (store.modalStatus === Status.OK) {
        closeAndResetModal(true)
      }
    },
  })
}

const socialMediaTypes = ref(Object.values(SocialMediaType).map(v => ({ label: v, value: v })))
</script>

<template>
  <Dialog v-model:visible="model" modal :header="modalTitle" class="w-1/4">
    <div class="flex flex-col items-center gap-3 mb-4">
      <div class="w-full h-40 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <LwpImage
          :public-id="bannerPublicId"
          :height="300"
          class-name="object-cover w-full h-full"
        />
      </div>
      <LwpImageUploader label="Upload Banner" @uploaded="onUpload" />
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
            :options="socialMediaTypes"
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

      <FormField name="link" #default="slotProps" class="w-full">
        <FloatLabel variant="on">
          <InputText v-model="slotProps.value" type="text" fluid />
          <label for="link">Link</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
          slotProps.error?.message
        }}</Message>
      </FormField>

      <div class="flex flex-row gap-1 justify-end w-full">
        <Button v-if="isUpdating" label="Delete" severity="danger" @click="attemptDelete" />
        <Button label="Cancel" variant="outlined" @click="closeAndResetModal()" />
        <Button
          :label="isUpdating ? 'Update' : 'Create'"
          type="submit"
          :loading="store.modalStatus === Status.LOADING"
        />
      </div>
    </Form>
  </Dialog>
</template>
