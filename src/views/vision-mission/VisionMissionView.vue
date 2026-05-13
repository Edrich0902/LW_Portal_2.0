<script setup lang="ts">
import { yupResolver } from '@primeuix/forms/resolvers/yup'
import * as yup from 'yup'
import { onBeforeMount, ref } from 'vue'
import { Form } from '@primevue/forms'
import type { FormSubmitEvent } from '@primevue/forms/form'
import { useVisionMissionStore } from '@stores/vision-mission/vision-mission.store.ts'
import { useToast } from 'primevue/usetoast'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import { Status } from '@/types/status.ts'
import type { VisionMission } from '@/types/meta-data/meta-data.ts'

const toast = useToast()
const visionMissionStore = useVisionMissionStore()

let initialValues = {}
const isReady = ref(false)
onBeforeMount(async () => {
  await visionMissionStore.initVisionMission()
  initializeForm()
  isReady.value = true
})

const initializeForm = () => {
  const visionStatement = visionMissionStore.data.find((item) => item.key === 'vision_statement')
  const missionStatement = visionMissionStore.data.find((item) => item.key === 'mission_statement')

  initialValues = {
    vision_statement: {
      title: visionStatement?.title ?? '',
      content: visionStatement?.content ?? '',
    },
    mission_statement: {
      title: missionStatement?.title ?? '',
      content: missionStatement?.content ?? '',
    },
  }
}

const resolver = yupResolver(
  yup.object().shape({
    vision_statement: yup.object({
      title: yup.string().required('Vision Statement title is required'),
      content: yup.string().required('Vision Statement content is required'),
    }),
    mission_statement: yup.object({
      title: yup.string().required('Mission Statement title is required'),
      content: yup.string().required('Mission Statement content is required'),
    }),
  }),
)

const onFormSubmit = async ({ valid, values }: FormSubmitEvent) => {
  if (!valid) {
    toast.add({ severity: 'error', summary: 'Some inputs are not valid', life: 2000 })
  }
  if (valid) {
    const visionStatement = visionMissionStore.data.find(
      (item) => item.key === 'vision_statement',
    ) as VisionMission
    const missionStatement = visionMissionStore.data.find(
      (item) => item.key === 'mission_statement',
    ) as VisionMission
    const updatedData: VisionMission[] = [
      {
        ...missionStatement,
        title: values.mission_statement.title,
        content: values.mission_statement.content,
      },
      {
        ...visionStatement,
        title: values.vision_statement.title,
        content: values.vision_statement.content,
      },
    ]

    isReady.value = false;
    await visionMissionStore.updateVisionMission(updatedData)
    initializeForm();
    isReady.value = true;
  }
}
</script>

<template>
  <PageWrapper show-toolbar title="Vision & Mission Statements" class="flex flex-col">
    <div
      v-if="visionMissionStore.status === Status.LOADING && !isReady"
      class="flex flex-col items-center justify-center"
    >
      <ProgressSpinner style="width: 50px; height: 50px" />
    </div>
    <Form
      v-if="visionMissionStore.status === Status.OK && isReady"
      @submit="onFormSubmit"
      :initialValues="initialValues"
      :resolver
      validateOnValueUpdate
      class="flex flex-col gap-4 mt-2"
    >
      <div class="flex flex-col gap-4">
        <div class="text-xl font-semibold">Vision</div>
        <FormField name="vision_statement.title" #default="slotProps">
          <FloatLabel variant="on">
            <InputText v-model="slotProps.value" type="text" fluid />
            <label for="vision_statement.title">Title</label>
          </FloatLabel>
          <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
            slotProps.error?.message
          }}</Message>
        </FormField>
        <FormField name="vision_statement.content" #default="slotProps">
          <FloatLabel variant="on">
            <Textarea v-model="slotProps.value" fluid />
            <label for="vision_statement.content">Content</label>
          </FloatLabel>
          <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
            slotProps.error?.message
          }}</Message>
        </FormField>
      </div>

      <Divider />

      <div class="flex flex-col gap-4">
        <div class="text-xl font-semibold">Mission</div>
        <FormField name="mission_statement.title" #default="slotProps">
          <FloatLabel variant="on">
            <InputText v-model="slotProps.value" type="text" fluid />
            <label for="mission_statement.title">Title</label>
          </FloatLabel>
          <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
            slotProps.error?.message
          }}</Message>
        </FormField>
        <FormField name="mission_statement.content" #default="slotProps">
          <FloatLabel variant="on">
            <Textarea v-model="slotProps.value" fluid />
            <label for="mission_statement.content">Content</label>
          </FloatLabel>
          <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">{{
            slotProps.error?.message
          }}</Message>
        </FormField>
      </div>

      <div class="flex flex-col items-center justify-end">
        <Button label="Update" type="submit" />
      </div>
    </Form>
  </PageWrapper>
</template>
