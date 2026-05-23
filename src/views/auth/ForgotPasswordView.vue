<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import supabase from '@lib/supabaseClient.ts'

const email = ref('')
const isSubmitting = ref(false)
// States: 'form' | 'success' | 'error'
const status = ref<'form' | 'success' | 'error'>('form')
const message = ref('')
const subMessage = ref('')

const handleSubmit = async () => {
  if (!email.value) return

  isSubmitting.value = true

  try {
    const redirectToUrl = window.location.origin + '/auth/reset-password'
    const { error } = await supabase.auth.resetPasswordForEmail(email.value.trim(), {
      redirectTo: redirectToUrl
    })

    if (error) {
      status.value = 'error'
      message.value = 'Stuur het misluk'
      subMessage.value = error.message || 'Kon nie die terugstelskakel stuur nie. Kontroleer asseblief jou e-posadres.'
      isSubmitting.value = false
      return
    }

    status.value = 'success'
    message.value = 'Skakel Gestuur!'
    subMessage.value = `Ons het 'n e-pos na ${email.value} gestuur met 'n skakel om jou wagwoord terug te stel. Maak asseblief jou e-pos oop om voort te gaan.`
  } catch (err: any) {
    status.value = 'error'
    message.value = 'Fout'
    subMessage.value = err.message || 'Iets het verkeerd geloop tydens die stuur.'
  } finally {
    isSubmitting.value = false
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
      <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
    </div>

    <!-- Right Column: Content Area -->
    <div class="w-full md:w-1/2 flex items-center justify-center p-8 bg-surface-0 dark:bg-surface-950">
      <div class="w-full max-w-md text-center md:text-left">
        <!-- Logo for Mobile -->
        <div class="md:hidden flex flex-col items-center mb-10">
          <img class="w-16 h-16 mb-4 rounded-2xl shadow-md" src="@assets/images/lwp_icon.png" alt="LWP Logo" />
          <h2 class="text-3xl font-bold text-surface-900 dark:text-surface-0">LWP Admin</h2>
        </div>

        <!-- 1. Form State -->
        <div v-if="status === 'form'">
          <div class="mb-10 text-center md:text-left">
            <h1 class="text-4xl font-extrabold text-surface-900 dark:text-surface-0 mb-3 tracking-tight">Wagwoord Vergeet</h1>
            <p class="text-surface-600 dark:text-surface-400 text-lg">Geen probleem nie. Sleutel jou e-posadres in en ons stuur vir jou 'n terugstelskakel.</p>
          </div>

          <form @submit.prevent="handleSubmit" class="flex flex-col gap-6 text-left">
            <div class="flex flex-col gap-2">
              <label for="email" class="font-semibold text-surface-700 dark:text-surface-300 text-sm">E-pos Adres</label>
              <input 
                id="email" 
                v-model="email" 
                type="email" 
                required 
                placeholder="jou.epos@voorbeeld.com"
                class="w-full p-4 text-lg border rounded-xl bg-surface-50 dark:bg-surface-900 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-0 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
            </div>

            <Button 
              label="Stuur Terugstelskakel" 
              type="submit" 
              :loading="isSubmitting" 
              class="w-full !py-4 !text-lg shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-all" />

            <div class="flex items-center justify-center mt-2">
              <RouterLink
                to="/"
                class="text-sm font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 hover:underline transition-all">
                Terug na Intekenbladsy
              </RouterLink>
            </div>
          </form>
        </div>

        <!-- 2. Success State -->
        <div v-else-if="status === 'success'" class="flex flex-col items-center text-center">
          <div class="w-24 h-24 rounded-full flex items-center justify-center mb-8 border shadow-sm bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400">
            <i class="text-5xl pi pi-check-circle"></i>
          </div>

          <h1 class="text-4xl font-extrabold text-surface-900 dark:text-surface-0 mb-4 tracking-tight">
            {{ message }}
          </h1>
          <p class="text-surface-600 dark:text-surface-400 text-lg leading-relaxed mb-10 max-w-sm mx-auto">
            {{ subMessage }}
          </p>

          <RouterLink to="/" class="w-full">
            <Button 
              label="Terug na Intekenbladsy" 
              class="w-full !py-4 !text-lg shadow-md active:scale-[0.98] transition-all" 
              severity="secondary" />
          </RouterLink>
        </div>

        <!-- 3. Error State -->
        <div v-else-if="status === 'error'" class="flex flex-col items-center text-center">
          <div class="w-24 h-24 rounded-full flex items-center justify-center mb-8 border shadow-sm bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
            <i class="text-5xl pi pi-times-circle"></i>
          </div>

          <h1 class="text-4xl font-extrabold text-surface-900 dark:text-surface-0 mb-4 tracking-tight">
            {{ message }}
          </h1>
          <p class="text-surface-600 dark:text-surface-400 text-lg leading-relaxed mb-10 max-w-sm mx-auto">
            {{ subMessage }}
          </p>

          <Button 
            label="Probeer Weer" 
            class="w-full !py-4 !text-lg shadow-md active:scale-[0.98] transition-all" 
            @click="status = 'form'" />
        </div>

        <p class="mt-12 text-center text-surface-500 dark:text-surface-400 text-sm">
          &copy; {{ new Date().getFullYear() }} Living Word. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>
