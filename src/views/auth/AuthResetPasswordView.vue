<script setup lang="ts">
import { ref, onMounted } from 'vue'
import supabase from '@lib/supabaseClient.ts'

const loading = ref(true)
// States: 'checking' | 'form' | 'success' | 'error'
const status = ref<'checking' | 'form' | 'success' | 'error'>('checking')
const message = ref('')
const subMessage = ref('')
const windowUrl = ref('')

const password = ref('')
const confirmPassword = ref('')
const formError = ref('')
const isSubmitting = ref(false)

const accessToken = ref('')
const refreshToken = ref('')

onMounted(async () => {
  try {
    windowUrl.value = window.location.href || (window as any)._initialHref || ''
    
    // 1. Check if we already have an active session (e.g. Supabase verified it on app boot)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      status.value = 'form'
      loading.value = false
      return
    }

    // 2. Fallback: Parse query and hash parameters, checking both active and captured variables
    const search = window.location.search || (window as any)._initialSearch || ''
    const hash = window.location.hash || (window as any)._initialHash || ''

    const searchParams = new URLSearchParams(search)
    const hashParams = new URLSearchParams(hash.replace('#', '?'))
    
    // Combine parameters to support both PKCE (query) and Implicit (hash) flows
    const error = searchParams.get('error') || hashParams.get('error')
    const errorDescription = searchParams.get('error_description') || hashParams.get('error_description')
    
    accessToken.value = searchParams.get('access_token') || hashParams.get('access_token') || ''
    refreshToken.value = searchParams.get('refresh_token') || hashParams.get('refresh_token') || ''
    const code = searchParams.get('code') || hashParams.get('code') || ''

    if (error) {
      status.value = 'error'
      message.value = 'Verifikasie het misluk'
      subMessage.value = errorDescription || 'Die skakel is moontlik ongeldig of het reeds verval. Probeer asseblief weer.'
      loading.value = false
      return
    }

    // Handle PKCE code exchange flow (typical for standard query links)
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        status.value = 'error'
        message.value = 'Verifikasie het misluk'
        subMessage.value = exchangeError.message || 'Die verifikasiekode is ongeldig of het verval.'
        loading.value = false
        return
      }
      status.value = 'form'
      loading.value = false
      return
    }

    // Handle Implicit grant flow (typical for hash links)
    if (accessToken.value && refreshToken.value) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken.value,
        refresh_token: refreshToken.value
      })

      if (sessionError) {
        status.value = 'error'
        message.value = 'Verifikasie het misluk'
        subMessage.value = sessionError.message || 'Die verifikasietoken is ongeldig of het verval.'
        loading.value = false
        return
      }

      status.value = 'form'
      loading.value = false
      return
    }

    // Fallback: If neither session nor parameters are present
    status.value = 'error'
    message.value = 'Verifikasie het misluk'
    subMessage.value = 'Ongeldige skakel. Geen verifikasiebesonderhede gevind nie.'
    loading.value = false
  } catch (err: any) {
    status.value = 'error'
    message.value = 'Fout'
    subMessage.value = err.message || 'Iets het verkeerd geloop tydens die verifikasie.'
    loading.value = false
  }
})

const handlePasswordReset = async () => {
  formError.value = ''
  
  if (password.value.length < 6) {
    formError.value = 'Wagwoord moet ten minste 6 karakters lank wees.'
    return
  }

  if (password.value !== confirmPassword.value) {
    formError.value = 'Wagwoorde stem nie ooreen nie.'
    return
  }

  isSubmitting.value = true

  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value
    })

    if (error) {
      formError.value = error.message || 'Kon nie wagwoord opdateer nie. Probeer asseblief weer.'
      isSubmitting.value = false
      return
    }

    // Sign out from web session after successful update to keep it clean
    await supabase.auth.signOut()

    status.value = 'success'
    message.value = 'Wagwoord Suksesvol Verander!'
    subMessage.value = 'Jou nuwe wagwoord is suksesvol gestel. Jy kan nou die app oopmaak en inteken met jou nuwe besonderhede.'
  } catch (err) {
    formError.value = 'Kommunikasiefout met die bediener.'
  } finally {
    isSubmitting.value = false
  }
}

const openApp = () => {
  window.location.href = 'lwpapp://'
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

        <!-- 1. Checking / Loading State -->
        <div v-if="status === 'checking'" class="flex flex-col items-center gap-6 py-12">
          <ProgressSpinner style="width: 80px; height: 80px" strokeWidth="4" />
          <p class="text-surface-600 dark:text-surface-400 text-lg">Besig om te verifieer...</p>
        </div>

        <!-- 2. Error State -->
        <div v-else-if="status === 'error'" class="flex flex-col items-center text-center">
          <div class="w-24 h-24 rounded-full flex items-center justify-center mb-8 border shadow-sm bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
            <i class="text-5xl pi pi-times-circle"></i>
          </div>

          <h1 class="text-4xl font-extrabold text-surface-900 dark:text-surface-0 mb-4 tracking-tight">
            {{ message }}
          </h1>
          <p class="text-surface-600 dark:text-surface-400 text-lg leading-relaxed mb-6 max-w-sm mx-auto">
            {{ subMessage }}
          </p>

          <div class="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl p-4 mb-8 text-xs font-mono break-all text-left">
            <div class="font-bold text-surface-500 mb-1">Gelaaide URL:</div>
            <div class="text-surface-700 dark:text-surface-300">{{ windowUrl }}</div>
          </div>

          <RouterLink to="/" class="w-full">
            <Button 
              label="Gaan na Intekenbladsy" 
              icon="pi pi-arrow-left" 
              class="w-full !py-4 !text-lg shadow-md active:scale-[0.98] transition-all" 
              severity="secondary" />
          </RouterLink>
        </div>

        <!-- 3. Form State: Reset Password -->
        <div v-else-if="status === 'form'">
          <div class="mb-10 text-center md:text-left">
            <h1 class="text-4xl font-extrabold text-surface-900 dark:text-surface-0 mb-3 tracking-tight">Nuwe Wagwoord</h1>
            <p class="text-surface-600 dark:text-surface-400 text-lg">Sleutel asseblief jou nuwe wagwoord hieronder in om jou wagwoord terug te stel.</p>
          </div>

          <form @submit.prevent="handlePasswordReset" class="flex flex-col gap-6 text-left">
            <div class="flex flex-col gap-2">
              <label for="new_password" class="font-semibold text-surface-700 dark:text-surface-300 text-sm">Nuwe Wagwoord</label>
              <input 
                id="new_password" 
                v-model="password" 
                type="password" 
                required 
                placeholder="Ten minste 6 karakters"
                class="w-full p-4 text-lg border rounded-xl bg-surface-50 dark:bg-surface-900 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-0 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
            </div>

            <div class="flex flex-col gap-2">
              <label for="confirm_password" class="font-semibold text-surface-700 dark:text-surface-300 text-sm">Bevestig Nuwe Wagwoord</label>
              <input 
                id="confirm_password" 
                v-model="confirmPassword" 
                type="password" 
                required 
                placeholder="Sleutel wagwoord weer in"
                class="w-full p-4 text-lg border rounded-xl bg-surface-50 dark:bg-surface-900 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-0 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
            </div>

            <p v-if="formError" class="text-red-500 text-sm font-medium -mt-2">
              {{ formError }}
            </p>

            <Button 
              label="Stel Wagwoord Terug" 
              type="submit" 
              :loading="isSubmitting" 
              class="w-full !py-4 !text-lg shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-all" />
          </form>
        </div>

        <!-- 4. Success State -->
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

          <Button 
            label="Maak Oop in die App" 
            icon="pi pi-external-link" 
            class="w-full !py-4 !text-lg shadow-md active:scale-[0.98] transition-all" 
            @click="openApp" />
        </div>

        <p class="mt-12 text-center text-surface-500 dark:text-surface-400 text-sm">
          &copy; {{ new Date().getFullYear() }} Living Word. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>
