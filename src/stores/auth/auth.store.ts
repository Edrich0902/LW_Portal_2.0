import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@supabase/supabase-js'
import { Status } from '@/types/status.ts'
import { type User as LwpUser } from '@/types/user/user.ts'
import supabase from '@lib/supabaseClient.ts'
import { supabaseAuth, supabaseSignOut } from '@services/auth/auth-service.ts'
import { useToast } from 'primevue/usetoast'

export const useAuthStore = defineStore('authStore', () => {
  const authed = ref(false)
  const user = ref<User | undefined>(undefined)
  const userProfile = ref<LwpUser | undefined>(undefined)
  const status = ref<Status>(Status.UNINITIALIZED)
  const message = ref<string>('')

  const toast = useToast();

  // listen for auth events
  supabase.auth.onAuthStateChange( (event, session) => {
    user.value = session?.user ?? undefined
    authed.value = !!user.value

    if (authed.value && !userProfile.value) loadSignedInUser().then() // get user profile of signed-in user
  })

  const initialise = async () => {
    status.value = Status.LOADING
    const { error } = await supabase.auth.getUser()
    if (error) {
      user.value = undefined
      status.value = Status.UNAUTHENTICATED
      return
    }
  }

  const authenticate = async (email: string, password: string): Promise<boolean> => {
    status.value = Status.LOADING
    const response = await supabaseAuth(email, password)

    if (response.success) {
      toast.add({severity: 'success', summary: 'Authentication Success', life: 2000})
      status.value = Status.OK
      return true
    } else {
      status.value = Status.ERROR
      message.value = response.message ? response.message : ''
      toast.add({severity: 'error', summary: 'Authentication Fail', detail: message.value, life: 2000})
      return false
    }
  }

  const signOut = async (): Promise<boolean> => {
    status.value = Status.LOADING
    const response = await supabaseSignOut()
    if (response.success) {
      toast.add({severity: 'success', summary: 'Successfully logged out', life: 2000})
      status.value = Status.OK
      return true
    }
    else {
      status.value = Status.ERROR
      message.value = response.message ? response.message : ''
      return false
    }
  }

  const loadSignedInUser = async () => {
    const { data, error } = await supabase
      .from("user_profile_view")
      .select('*')
      .eq('id', user.value?.id)
      .single<LwpUser>()

    if (!error) userProfile.value = data
  }

  return { authed, user, userProfile, status, authenticate, signOut, initialise }
})
