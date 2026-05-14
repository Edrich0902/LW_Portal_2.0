<script setup lang="ts">
import { yupResolver } from '@primeuix/forms/resolvers/yup'
import * as yup from 'yup'
import { useToast } from 'primevue/usetoast'
import { onBeforeMount, ref } from 'vue'
import { Form } from '@primevue/forms';
import type { FormSubmitEvent } from '@primevue/forms/form'
import { useAuthStore } from '@stores/auth/auth.store.ts'
import router from '@/router'
import { Status } from '@/types/status.ts'

const toast = useToast()
const auth = useAuthStore()

onBeforeMount(async () => {
  if (auth.authed) await router.replace('/dashboard')
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
    if (success) await router.replace('/dashboard')
  }
}
</script>

<template>
  <div class="h-dvh w-full flex flex-row overflow-hidden">
    <!-- Left Column: Brand Area -->
    <div class="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary-700 to-primary-900 items-center justify-center p-12 relative">
      <div class="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
      <div class="flex flex-col items-center text-center z-10">
        <div class="bg-white/10 p-4 rounded-3xl backdrop-blur-md mb-8 border border-white/20 shadow-2xl">
          <img class="w-24 h-24 rounded-2xl shadow-lg" src="@assets/images/lwp_icon.png" alt="LWP Logo" />
        </div>
        <h1 class="text-5xl font-bold text-white mb-4 tracking-tight">LWP Admin</h1>
        <p class="text-primary-100 text-lg max-w-sm font-medium leading-relaxed opacity-90">
          Empowering your church community through seamless management and connection.
        </p>
      </div>
      <!-- Decorative bottom pattern -->
      <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
    </div>

    <!-- Right Column: Form Area -->
    <div class="w-full md:w-1/2 flex items-center justify-center p-8 bg-surface-0 dark:bg-surface-950">
      <div class="w-full max-w-md">
        <div class="md:hidden flex flex-col items-center mb-10">
          <img class="w-16 h-16 mb-4 rounded-2xl shadow-md" src="@assets/images/lwp_icon.png" alt="LWP Logo" />
          <h2 class="text-3xl font-bold text-surface-900 dark:text-surface-0">LWP Admin</h2>
        </div>

        <div class="mb-10 text-center md:text-left">
          <h1 class="text-4xl font-extrabold text-surface-900 dark:text-surface-0 mb-3 tracking-tight">Welcome back</h1>
          <p class="text-surface-600 dark:text-surface-400 text-lg">Please enter your details to sign in.</p>
        </div>

        <Form
          v-slot="$form"
          @submit="onFormSubmit"
          :initialValues :resolver validateOnValueUpdate
          class="flex flex-col gap-6">
          <div class="flex flex-col gap-2">
            <FloatLabel variant="on">
              <InputText 
                id="email" 
                name="email" 
                type="email" 
                inputmode="email" 
                class="w-full !p-4 !text-lg" 
                fluid />
              <label for="email" class="font-medium text-surface-500">Email address</label>
            </FloatLabel>
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">{{ $form.email.error.message }}</Message>
          </div>
          
          <div class="flex flex-col gap-2">
            <FloatLabel variant="on">
              <Password 
                id="password" 
                name="password" 
                :feedback="false" 
                toggleMask 
                inputClass="w-full !p-4 !text-lg" 
                fluid/>
              <label for="password" class="font-medium text-surface-500">Password</label>
            </FloatLabel>
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">{{ $form.password.error.message }}</Message>
          </div>

          <div class="flex items-center justify-end -mt-2">
            <RouterLink
              to="/forgot-password"
              class="text-sm font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 hover:underline transition-all">
              Forgot your password?
            </RouterLink>
          </div>

          <Button 
            label="Sign in" 
            type="submit" 
            :loading="auth.status === Status.LOADING" 
            class="w-full !py-4 !text-lg shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-all" />
        </Form>

        <p class="mt-12 text-center text-surface-500 dark:text-surface-400 text-sm">
          &copy; {{ new Date().getFullYear() }} Living Word. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-floatlabel label) {
  left: 1rem;
}
</style>
