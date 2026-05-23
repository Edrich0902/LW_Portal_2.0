<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(true)
const status = ref<'success' | 'error'>('success')
const message = ref('')
const subMessage = ref('')

onMounted(() => {
  // Parse parameters robustly from both URL search and hash strings
  const hash = window.location.hash
  const params = new URLSearchParams(hash.replace('#', '?'))

  const error = params.get('error')
  const errorDescription = params.get('error_description')

  if (error) {
    status.value = 'error'
    message.value = 'Verifikasie het misluk'
    subMessage.value = errorDescription || 'Die skakel is moontlik ongeldig of het reeds verval. Probeer asseblief weer.'
    loading.value = false
    return
  }

  // Default is email confirmation success
  status.value = 'success'
  message.value = 'E-pos Bevestig!'
  subMessage.value = 'Baie geluk, jou e-posadres is suksesvol geverifieer. Ons stuur jou nou terug na die foon-toepassing...'
  loading.value = false

  // Attempt to redirect to mobile app using custom scheme and forwarding the auth hash parameters
  const deepLink = `lwpapp://login-callback${hash}`
  window.location.href = deepLink
  
  setTimeout(() => {
    window.location.href = deepLink
  }, 1500)
})

const openApp = () => {
  const hash = window.location.hash
  window.location.href = `lwpapp://login-callback${hash}`
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
      <div class="w-full max-w-md text-center">
        <!-- Logo for Mobile -->
        <div class="md:hidden flex flex-col items-center mb-10">
          <img class="w-16 h-16 mb-4 rounded-2xl shadow-md" src="@assets/images/lwp_icon.png" alt="LWP Logo" />
          <h2 class="text-3xl font-bold text-surface-900 dark:text-surface-0">LWP Admin</h2>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center gap-6 py-12">
          <ProgressSpinner style="width: 80px; height: 80px" strokeWidth="4" />
          <p class="text-surface-600 dark:text-surface-400 text-lg">Besig om te verifieer...</p>
        </div>

        <!-- Content Area when Loaded -->
        <div v-else class="flex flex-col items-center">
          <!-- Icon Header -->
          <div class="w-24 h-24 rounded-full flex items-center justify-center mb-8 border shadow-sm"
               :class="{
                 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400': status === 'success',
                 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400': status === 'error'
               }">
            <i class="text-5xl"
               :class="{
                 'pi pi-check-circle': status === 'success',
                 'pi pi-times-circle': status === 'error'
               }"></i>
          </div>

          <h1 class="text-4xl font-extrabold text-surface-900 dark:text-surface-0 mb-4 tracking-tight">
            {{ message }}
          </h1>
          <p class="text-surface-600 dark:text-surface-400 text-lg leading-relaxed mb-10 max-w-sm mx-auto">
            {{ subMessage }}
          </p>

          <!-- Action Button -->
          <div class="w-full flex flex-col gap-4">
            <template v-if="status === 'success'">
              <Button 
                label="Maak Oop in die App" 
                icon="pi pi-external-link" 
                class="w-full !py-4 !text-lg shadow-md active:scale-[0.98] transition-all" 
                @click="openApp" />
            </template>
            <template v-else>
              <RouterLink to="/" class="w-full">
                <Button 
                  label="Gaan na Intekenbladsy" 
                  icon="pi pi-arrow-left" 
                  class="w-full !py-4 !text-lg shadow-md active:scale-[0.98] transition-all" 
                  severity="secondary" />
              </RouterLink>
            </template>
          </div>
        </div>

        <p class="mt-12 text-center text-surface-500 dark:text-surface-400 text-sm">
          &copy; {{ new Date().getFullYear() }} Living Word. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>
