<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import type { Sermon } from '@/types/sermon/sermon.ts'
import type { FormSubmitEvent } from '@primevue/forms/form'
import { useToast } from 'primevue/usetoast'
import { yupResolver } from '@primeuix/forms/resolvers/yup'
import * as yup from 'yup'
import { Status } from '@/types/status.ts'
import { useSermonsStore } from '@stores/sermons/sermons.store.ts'
import { useConfirm } from 'primevue'

const toast = useToast()
const confirm = useConfirm()
const store = useSermonsStore()

const props = withDefaults(
  defineProps<{
    visible: boolean
    sermon?: Sermon
  }>(),
  {
    sermon: undefined,
  },
)

let initialValues: Partial<Sermon> = {}
const isReady = ref(false)

onBeforeMount(() => {
  initialValues = {
    title: props.sermon?.title ?? '',
    link: props.sermon?.link ?? '',
    description: props.sermon?.description ?? undefined,
    pastor: props.sermon?.pastor ?? '',
  }

  isReady.value = true
})

const resolver = ref(
  yupResolver(
    yup.object().shape({
      title: yup.string().required('Title is required'),
      link: yup.string().required('Link is required'),
      description: yup.string().required('Description is required'),
      pastor: yup.string().required('Pastor is required'),
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
  return props.sermon && props.sermon.id ? 'Update Sermon' : 'Create Sermon'
})

const isUpdating = computed(() => {
  return props.sermon && props.sermon.id
})

const closeAndResetModal = (shouldRefresh: boolean = false) => {
  model.value = false
  emit("close", shouldRefresh)
}

const onFormSubmit = async ({ valid, values }: FormSubmitEvent<Sermon>) => {
  if (!valid) toast.add({ severity: 'error', summary: 'Some inputs are invalid', life: 2000 })
  if (isUpdating.value) {
    await store.updateSermon({ ...props.sermon, ...values })
  } else {
    await store.createSermon(values)
  }

  if (store.modalStatus === Status.OK) {
    closeAndResetModal(true)
  }
}

const attemptDelete = (event: MouseEvent) => {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: "Are you sure you want to delete this Sermon?",
    icon: 'pi pi-info-circle',
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "Delete",
      severity: "danger",
    },
    accept: async () => {
      await store.deleteSermon(props.sermon!)

      if (store.modalStatus === Status.OK) {
        closeAndResetModal(true)
      }
    }
  })
}
</script>

<template>
  <Dialog v-model:visible="model" modal :header="modalTitle" class="w-1/4">
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

      <FormField name="pastor" #default="slotProps" class="w-full">
        <FloatLabel variant="on">
          <InputText v-model="slotProps.value" type="text" fluid />
          <label for="pastor">Pastor</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
          slotProps.error?.message
        }}</Message>
      </FormField>

      <FormField name="link" #default="slotProps" class="w-full">
        <FloatLabel variant="on">
          <InputText v-model="slotProps.value" type="text" fluid />
          <label for="link">Youtube Link</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
          slotProps.error?.message
        }}</Message>
      </FormField>

      <FormField name="description" #default="slotProps" class="w-full">
        <FloatLabel variant="on">
          <InputText v-model="slotProps.value" type="text" fluid />
          <label for="description">Description</label>
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
