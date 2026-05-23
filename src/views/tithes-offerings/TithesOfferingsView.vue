<script setup lang="ts">
import { yupResolver } from '@primeuix/forms/resolvers/yup'
import * as yup from 'yup'
import { onBeforeMount, ref } from 'vue'
import { Form } from '@primevue/forms'
import type { FormSubmitEvent } from '@primevue/forms/form'
import { useToast } from 'primevue/usetoast'
import { useTithesOfferingsStore } from '@stores/tithes-offerings/tithes-offerings.store.ts'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import LwpImageUploader from '@components/lwp-image/LwpImageUploader.vue'
import LwpImage from '@components/lwp-image/LwpImage.vue'
import { Status } from '@/types/status.ts'
import type { TithesOfferingsSettings } from '@/types/tithes-offerings/tithes-offerings.ts'

const toast = useToast()
const store = useTithesOfferingsStore()

let initialValues: Partial<TithesOfferingsSettings> = {}
const isReady = ref(false)
const headerImagePublicId = ref<string | undefined>(undefined)
const headerImageUrl = ref<string | undefined>(undefined)

onBeforeMount(async () => {
  await store.initSettings()
  initializeForm()
  isReady.value = true
})

const initializeForm = () => {
  headerImagePublicId.value = store.data?.header_image_public_id
  headerImageUrl.value = store.data?.header_image_url

  initialValues = {
    bank: store.data?.bank ?? '',
    account_name: store.data?.account_name ?? '',
    account_number: store.data?.account_number ?? '',
    branch_code: store.data?.branch_code ?? '',
    reference: store.data?.reference ?? '',
    snapscan_qr_url: store.data?.snapscan_qr_url ?? '',
  }
}

const resolver = yupResolver(
  yup.object().shape({
    bank: yup.string().required('Bank name is required'),
    account_name: yup.string().required('Account name is required'),
    account_number: yup.string().required('Account number is required'),
    branch_code: yup.string().required('Branch code is required'),
    reference: yup.string().required('Reference is required'),
    snapscan_qr_url: yup.string().url('Must be a valid URL').nullable(),
  }),
)

const onHeaderImageUpload = (info: { public_id: string; secure_url: string }) => {
  headerImagePublicId.value = info.public_id
  headerImageUrl.value = info.secure_url
  toast.add({ severity: 'success', summary: 'Header image uploaded', life: 2000 })
}

const onFormSubmit = async ({ valid, values }: FormSubmitEvent) => {
  if (!valid) {
    toast.add({ severity: 'error', summary: 'Some fields are invalid', life: 2000 })
    return
  }

  const updated: TithesOfferingsSettings = {
    ...store.data,
    bank: values.bank,
    account_name: values.account_name,
    account_number: values.account_number,
    branch_code: values.branch_code,
    reference: values.reference,
    snapscan_qr_url: values.snapscan_qr_url || undefined,
    header_image_public_id: headerImagePublicId.value,
    header_image_url: headerImageUrl.value,
  }

  isReady.value = false
  await store.updateSettings(updated)
  initializeForm()
  isReady.value = true
}
</script>

<template>
  <PageWrapper show-toolbar title="Tithes & Offerings Settings" class="flex flex-col">
    <div
      v-if="store.status === Status.LOADING && !isReady"
      class="flex flex-col gap-4 p-4 max-w-4xl mx-auto w-full"
    >
      <Skeleton width="100%" height="3rem" />
      <Skeleton width="100%" height="3rem" />
      <Skeleton width="100%" height="3rem" />
      <Skeleton width="100%" height="3rem" />
      <Skeleton width="100%" height="3rem" />
      <Divider />
      <Skeleton width="100%" height="10rem" />
      <Skeleton width="100%" height="3rem" />
    </div>

    <Form
      v-if="store.status === Status.OK && isReady"
      @submit="onFormSubmit"
      :initialValues="initialValues"
      :resolver
      validateOnValueUpdate
      class="flex flex-col gap-4 mt-2 max-w-4xl mx-auto w-full p-4"
    >
      <div class="text-xl font-semibold">Banking Details (EFT)</div>

      <FormField name="bank" #default="slotProps">
        <FloatLabel variant="on">
          <InputText v-model="slotProps.value" type="text" fluid />
          <label>Bank</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">
          {{ slotProps.error?.message }}
        </Message>
      </FormField>

      <FormField name="account_name" #default="slotProps">
        <FloatLabel variant="on">
          <InputText v-model="slotProps.value" type="text" fluid />
          <label>Account Name</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">
          {{ slotProps.error?.message }}
        </Message>
      </FormField>

      <FormField name="account_number" #default="slotProps">
        <FloatLabel variant="on">
          <InputText v-model="slotProps.value" type="text" fluid />
          <label>Account Number</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">
          {{ slotProps.error?.message }}
        </Message>
      </FormField>

      <FormField name="branch_code" #default="slotProps">
        <FloatLabel variant="on">
          <InputText v-model="slotProps.value" type="text" fluid />
          <label>Branch Code</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">
          {{ slotProps.error?.message }}
        </Message>
      </FormField>

      <FormField name="reference" #default="slotProps">
        <FloatLabel variant="on">
          <InputText v-model="slotProps.value" type="text" fluid />
          <label>Reference</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">
          {{ slotProps.error?.message }}
        </Message>
      </FormField>

      <Divider />

      <div class="text-xl font-semibold">Media</div>

      <FormField name="snapscan_qr_url" #default="slotProps">
        <FloatLabel variant="on">
          <InputText v-model="slotProps.value" type="text" fluid />
          <label>SnapScan QR Code URL</label>
        </FloatLabel>
        <Message v-if="slotProps.invalid" severity="error" size="small" variant="simple">
          {{ slotProps.error?.message }}
        </Message>
      </FormField>

      <div class="flex flex-col gap-3">
        <div class="text-sm font-medium text-surface-500">Header Image</div>
        <div class="w-full h-48 bg-surface-100 dark:bg-surface-800 rounded-xl overflow-hidden flex items-center justify-center">
          <LwpImage
            :public-id="headerImagePublicId"
            :height="300"
            class-name="object-cover w-full h-full"
          />
        </div>
        <LwpImageUploader label="Upload Header Image" @uploaded="onHeaderImageUpload" />
      </div>

      <div class="flex justify-end mt-2">
        <Button label="Save" type="submit" />
      </div>
    </Form>
  </PageWrapper>
</template>
