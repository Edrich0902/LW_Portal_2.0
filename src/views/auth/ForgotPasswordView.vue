<script setup lang="ts">
import { RouterLink } from 'vue-router'
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
      <div class="w-full max-w-md">
        <div class="md:hidden flex flex-col items-center mb-10">
          <img class="w-16 h-16 mb-4 rounded-2xl shadow-md" src="@assets/images/lwp_icon.png" alt="LWP Logo" />
          <h2 class="text-3xl font-bold text-surface-900 dark:text-surface-0">LWP Admin</h2>
        </div>

        <div class="mb-10 text-center md:text-left">
          <h1 class="text-4xl font-extrabold text-surface-900 dark:text-surface-0 mb-3 tracking-tight">Reset Password</h1>
          <p class="text-surface-600 dark:text-surface-400 text-lg">Don't worry, it happens to the best of us.</p>
        </div>

        <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-8 mb-8">
          <div class="flex flex-col items-center md:items-start text-center md:text-left gap-4">
            <div class="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-2">
              <i class="pi pi-shield text-3xl text-primary-600 dark:text-primary-400"></i>
            </div>
            <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0">Administrative Reset Only</h3>
            <p class="text-surface-600 dark:text-surface-400 leading-relaxed">
              Automated password reset is currently disabled for security reasons. To regain access, please contact your system administrator or the IT support team directly.
            </p>
          </div>
        </div>
        
        <RouterLink to="/">
          <Button 
            label="Return to Sign In" 
            icon="pi pi-arrow-left" 
            class="w-full !py-4 !text-lg shadow-md active:scale-[0.98] transition-all" 
            severity="secondary"
            variant="outlined" />
        </RouterLink>

        <p class="mt-12 text-center text-surface-500 dark:text-surface-400 text-sm">
          &copy; {{ new Date().getFullYear() }} Living Word. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>
