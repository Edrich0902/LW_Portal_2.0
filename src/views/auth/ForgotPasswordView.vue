<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="h-dvh w-full flex flex-col items-center justify-center px-6 py-8 mx-auto my-auto">
    <div class="flex items-center mb-6 text-2xl font-semibold text-primary-900 dark:text-white">
      <img class="w-10 h-10 mr-2 rounded-full" src="@assets/images/lwp_icon.png" alt="LWP Logo" />
      LWP Admin
    </div>
    <Card class="w-full md:w-1/2 lg:w-1/3 xl:1/4">
      <template #title>Reset Password</template>
      <template #content>
        <div class="flex flex-col gap-6 text-center py-4">
          <div class="flex flex-col gap-2 items-center">
            <i class="pi pi-info-circle text-4xl text-primary mb-2"></i>
            <p class="text-lg font-medium">Automated password reset is currently unavailable.</p>
            <p class="text-surface-600 dark:text-surface-400">
              Please contact the system administrator or support team to reset your password.
            </p>
          </div>
          
          <div class="border-t border-surface-200 dark:border-surface-700 pt-6">
            <RouterLink to="/">
              <Button label="Back to Login" icon="pi pi-arrow-left" variant="text" fluid />
            </RouterLink>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
