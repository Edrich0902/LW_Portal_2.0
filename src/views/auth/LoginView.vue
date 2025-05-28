<script setup lang="ts">
import { yupResolver } from '@primeuix/forms/resolvers/yup'
import * as yup from 'yup'
import { useToast } from 'primevue/usetoast'
import { onBeforeMount, ref } from 'vue'
import { Form } from '@primevue/forms';
import type { FormSubmitEvent } from '@primevue/forms/form'
import { useAuthStore } from '@stores/auth/auth.store.ts'
import router from '@/router'

const toast = useToast()
const auth = useAuthStore()

onBeforeMount(async () => {
  if (auth.authed) await router.replace('/forgot-password')
})

const initialValues = ref({
  email: '',
  password: '',
})

const resolver = ref(
  yupResolver(
    yup.object().shape({
      email: yup.string().email("Email not valid").required('Email is required'),
      password: yup.string().required('Password is required'),
    }),
  ),
)

const onFormSubmit = async ({ valid, values }: FormSubmitEvent) => {
  if (!valid) toast.add({severity: 'error', summary: 'Some inputs are not valid', life: 2000})
  if (valid) {
    const success = await auth.authenticate(values.email, values.password)
    if (success) await router.replace('/forgot-password')
  }
}
</script>

<template>
  <div class="h-dvh w-full flex flex-col items-center justify-center px-6 py-8 mx-auto my-auto">
    <div class="flex items-center mb-6 text-2xl font-semibold text-primary-900 dark:text-white">
      <img class="w-10 h-10 mr-2 rounded-full" src="@assets/images/lwp_icon.png" alt="LWP Logo" />
      LWP Admin
    </div>
    <Card class="w-full md:w-1/2 lg:w-1/3 xl:1/4">
      <template #title>Sign in to your account</template>
      <template #content>
        <Form
          v-slot="$form"
          @submit="onFormSubmit"
          :initialValues :resolver validateOnValueUpdate
          class="flex flex-col gap-4 mt-2">
          <div class="flex flex-col gap-1">
            <FloatLabel variant="on">
              <InputText id="email" name="email" type="email" inputmode="email" fluid />
              <label for="email">Email</label>
            </FloatLabel>
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">{{ $form.email.error.message }}</Message>
          </div>
          <div class="flex flex-col gap-1">
            <FloatLabel variant="on">
              <Password id="password" name="password" :feedback="false" toggleMask fluid/>
              <label for="password">Password</label>
            </FloatLabel>
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">{{ $form.password.error.message }}</Message>
          </div>
          <div class="flex flex-col gap-1">
            <Button label="Sign in" type="submit" />
          </div>
          <RouterLink
            to="/forgot-password"
            class="text-sm self-end text-primary hover:text-primary-300 hover:underline">
            Forgot password?
          </RouterLink>
        </Form>
      </template>
    </Card>
  </div>
</template>
