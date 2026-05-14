<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import type { FormSubmitEvent } from '@primevue/forms/form'
import { useToast } from 'primevue/usetoast'
import { yupResolver } from '@primeuix/forms/resolvers/yup'
import * as yup from 'yup'
import { Status } from '@/types/status.ts'
import { useConfirm } from 'primevue'
import type { Event } from '@/types/event/event.ts'
import { EventCategory } from '@/types/eventCategory.ts'
import { EventType } from '@/types/eventType.ts'
import { Weekday } from '@/types/weekday.ts'
import { useEventsStore } from '@stores/events/events.store.ts'

const toast = useToast()
const confirm = useConfirm()
const store = useEventsStore()

const props = withDefaults(
  defineProps<{
    visible: boolean
    eventItem?: Event
  }>(),
  {
    eventItem: undefined,
  },
)

let initialValues: Partial<Event> = {}
const isReady = ref(false)
const bannerPublicId = ref<string | undefined>(props.eventItem?.banner_public_id)
const bannerUrl = ref<string | undefined>(props.eventItem?.banner_url)

onBeforeMount(() => {
  initialValues = {
    title: props.eventItem?.title ?? '',
    description: props.eventItem?.description ?? '',
    category: props.eventItem?.category ?? EventCategory.GENERAL,
    type: props.eventItem?.type ?? EventType.WEEKLY,
    day: props.eventItem?.day ?? Weekday.SUNDAY,
    time: props.eventItem?.time ?? '',
    start_date: props.eventItem?.start_date ? new Date(props.eventItem.start_date) : undefined,
    end_date: props.eventItem?.end_date ? new Date(props.eventItem.end_date) : undefined,
  }

  isReady.value = true
})

const resolver = ref(
  yupResolver(
    yup.object().shape({
      title: yup.string().required('Title is required'),
      description: yup.string().required('Description is required'),
      category: yup.string().required('Category is required'),
      type: yup.string().required('Type is required'),
      day: yup.string().required('Day is required'),
      time: yup.string().required('Time is required'),
      start_date: yup.date().nullable(),
      end_date: yup.date().nullable(),
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
  return props.eventItem && props.eventItem.id ? 'Update Event' : 'Create Event'
})

const isUpdating = computed(() => {
  return props.eventItem && props.eventItem.id
})

const closeAndResetModal = (shouldRefresh: boolean = false) => {
  model.value = false
  emit('close', shouldRefresh)
}

interface FormValues extends Omit<Event, 'start_date' | 'end_date'> {
  start_date?: Date | null
  end_date?: Date | null
}

const onFormSubmit = async ({ valid, values }: FormSubmitEvent<FormValues>) => {
  if (!valid) {
    toast.add({ severity: 'error', summary: 'Some inputs are invalid', life: 2000 })
    return
  }

  const payload = {
    ...props.eventItem,
    ...values,
    start_date: values.start_date ? moment(values.start_date).format('YYYY-MM-DD') : null,
    end_date: values.end_date ? moment(values.end_date).format('YYYY-MM-DD') : null,
    banner_public_id: bannerPublicId.value,
    banner_url: bannerUrl.value,
  }

  if (isUpdating.value) {
    await store.updateEvent(payload as unknown as Event)
  } else {
    await store.createEvent(payload as unknown as Event)
  }

  if (store.modalStatus === Status.OK) {
    closeAndResetModal(true)
  }
}

const onUpload = (info: { public_id: string; secure_url: string }) => {
  bannerPublicId.value = info.public_id
  bannerUrl.value = info.secure_url
  toast.add({ severity: 'success', summary: 'Image uploaded', life: 2000 })
}

const attemptDelete = (event: MouseEvent) => {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: 'Are you sure you want to delete this Event?',
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
      await store.deleteEvent(props.eventItem!)

      if (store.modalStatus === Status.OK) {
        closeAndResetModal(true)
      }
    },
  })
}

const eventCategories = ref(Object.values(EventCategory).map(v => ({ label: v.toUpperCase(), value: v })))
const eventTypes = ref(Object.values(EventType).map(v => ({ label: v.toUpperCase(), value: v })))
const weekdays = ref(Object.values(Weekday).map(v => ({ label: v, value: v })))
</script>

<template>
  <Dialog v-model:visible="model" modal :header="modalTitle" class="w-1/3">
    <div class="flex flex-col items-center gap-3 mb-4">
      <div class="w-full h-40 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <LwpImage
          :public-id="bannerPublicId"
          :height="300"
          class-name="object-cover w-full h-full"
        />
      </div>
      <LwpImageUploader label="Upload Event Banner" @uploaded="onUpload" />
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

      <div class="flex flex-row gap-3 w-full">
        <FormField name="category" #default="slotProps" class="w-full">
          <FloatLabel variant="on">
            <Select
              v-model="slotProps.value"
              :options="eventCategories"
              optionLabel="label"
              optionValue="value"
              placeholder="Category"
              fluid
            />
            <label for="category">Category</label>
          </FloatLabel>
          <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
            slotProps.error?.message
          }}</Message>
        </FormField>

        <FormField name="type" #default="slotProps" class="w-full">
          <FloatLabel variant="on">
            <Select
              v-model="slotProps.value"
              :options="eventTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Type"
              fluid
            />
            <label for="type">Type</label>
          </FloatLabel>
          <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
            slotProps.error?.message
          }}</Message>
        </FormField>
      </div>

      <div class="flex flex-row gap-3 w-full">
        <FormField name="day" #default="slotProps" class="w-full">
          <FloatLabel variant="on">
            <Select
              v-model="slotProps.value"
              :options="weekdays"
              optionLabel="label"
              optionValue="value"
              placeholder="Day"
              fluid
            />
            <label for="day">Day</label>
          </FloatLabel>
          <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
            slotProps.error?.message
          }}</Message>
        </FormField>

        <FormField name="time" #default="slotProps" class="w-full">
          <FloatLabel variant="on">
            <InputText v-model="slotProps.value" type="text" fluid />
            <label for="time">Time (e.g. 18:30)</label>
          </FloatLabel>
          <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
            slotProps.error?.message
          }}</Message>
        </FormField>
      </div>

      <div class="flex flex-row gap-3 w-full">
        <FormField name="start_date" #default="slotProps" class="w-full">
          <FloatLabel variant="on">
            <DatePicker v-model="slotProps.value" dateFormat="yy-mm-dd" fluid />
            <label for="start_date">Start Date</label>
          </FloatLabel>
          <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
            slotProps.error?.message
          }}</Message>
        </FormField>

        <FormField name="end_date" #default="slotProps" class="w-full">
          <FloatLabel variant="on">
            <DatePicker v-model="slotProps.value" dateFormat="yy-mm-dd" fluid />
            <label for="end_date">End Date</label>
          </FloatLabel>
          <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
            slotProps.error?.message
          }}</Message>
        </FormField>
      </div>

      <FormField name="description" #default="slotProps" class="w-full">
        <FloatLabel variant="on">
          <Textarea v-model="slotProps.value" rows="3" fluid autoResize />
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
