import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@supabase/supabase-js'
import { Status } from '@/types/status.ts'
import { type User as LwpUser, UserRole } from '@/types/user/user.ts'
import supabase from '@lib/supabaseClient.ts'
import { supabaseAuth, supabaseSignOut } from '@services/auth/auth-service.ts'
import { useToast } from 'primevue/usetoast'

export const useAuthStore = defineStore('authStore', () => {
  const authed = ref(false)
  const user = ref<User | undefined>(undefined)
  const userProfile = ref<LwpUser | undefined>(undefined)
  const status = ref<Status>(Status.UNINITIALIZED)
  const message = ref<string>('')

  const toast = useToast()

  // listen for auth events
  supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user ?? undefined

    if (event === 'SIGNED_OUT') {
      authed.value = false
      user.value = undefined
      userProfile.value = undefined
    }
  })

  const initialise = async () => {
    status.value = Status.LOADING
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser()

    if (error || !supabaseUser) {
      user.value = undefined
      authed.value = false
      status.value = Status.UNAUTHENTICATED
      return
    }

    user.value = supabaseUser
    const isSuperAdmin = await loadSignedInUser(supabaseUser.id)

    if (isSuperAdmin) {
      authed.value = true
      status.value = Status.OK
    } else {
      // If session exists but not super admin, sign out immediately
      await supabaseSignOut()
      authed.value = false
      user.value = undefined
      userProfile.value = undefined
      status.value = Status.UNAUTHENTICATED
    }
  }

  const authenticate = async (email: string, password: string): Promise<boolean> => {
    status.value = Status.LOADING
    const response = await supabaseAuth(email, password)

    if (response.success) {
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser()

      if (supabaseUser) {
        user.value = supabaseUser
        const isSuperAdmin = await loadSignedInUser(supabaseUser.id)

        if (isSuperAdmin) {
          toast.add({ severity: 'success', summary: 'Authentication Success', life: 2000 })
          authed.value = true
          status.value = Status.OK
          return true
        } else {
          await supabaseSignOut()
          authed.value = false
          user.value = undefined
          userProfile.value = undefined
          message.value = 'Access Denied: Only Super Admins can access this system'
          toast.add({
            severity: 'error',
            summary: 'Access Denied',
            detail: message.value,
            life: 3000,
          })
          status.value = Status.ERROR
          return false
        }
      }
    }

    status.value = Status.ERROR
    message.value = response.message ? response.message : ''
    toast.add({
      severity: 'error',
      summary: 'Authentication Fail',
      detail: message.value,
      life: 2000,
    })
    return false
  }

  const signOut = async (): Promise<boolean> => {
    status.value = Status.LOADING
    const response = await supabaseSignOut()
    if (response.success) {
      authed.value = false
      user.value = undefined
      userProfile.value = undefined
      toast.add({ severity: 'success', summary: 'Successfully logged out', life: 2000 })
      status.value = Status.OK
      return true
    } else {
      status.value = Status.ERROR
      message.value = response.message ? response.message : ''
      return false
    }
  }

  const loadSignedInUser = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('user_profile_view')
      .select('*')
      .eq('id', userId)
      .single<LwpUser>()

    if (error || !data) {
      return false
    }

    userProfile.value = data
    return data.role === UserRole.SUPER_ADMIN
  }

  return { authed, user, userProfile, status, authenticate, signOut, initialise }
})
