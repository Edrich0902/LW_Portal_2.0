import supabase from '@lib/supabaseClient.ts'
import type { AuthenticationResponse } from '@/types/auth-response.ts'

export const supabaseAuth = async (email: string, password: string): Promise<AuthenticationResponse> => {
  const { error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  })

  if (error != null) return { code: error.code, message: error.message, success: false }
  return { code: 'success', message: 'Authentication Successful', success: true }
}

export const supabaseSignOut = async (): Promise<AuthenticationResponse> => {
  const { error } = await supabase.auth.signOut()

  if (error != null) return { code: error.code, message: error.message, success: false }
  return { code: 'success', message: 'Logged out', success: true }
}
