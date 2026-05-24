import type { User } from '@/types/user/user.ts'
import type { SingleSupabaseResponse, SupabaseResponse } from '@/types/supabase-response.ts'
import supabase from '@lib/supabaseClient.ts'

export const sbFetchAdminUsers = async (): Promise<SupabaseResponse<User>> => {
  const { data, error } = await supabase.rpc('get_admin_users')

  if (error) {
    console.error(error.code, error.message)
    return {
      data: [],
      error,
      count: 0,
    }
  }

  return {
    data: (data as User[]) ?? [],
    error: undefined,
    count: (data as User[])?.length ?? 0,
  }
}

export const sbGetSignedInAdminUser = async (userId: string): Promise<SingleSupabaseResponse<User>> => {
  const { data, error } = await supabase.rpc('get_admin_user_profile', {
    target_user_id: userId,
  })

  if (error) {
    console.error(error.code, error.message)
    return {
      data: null,
      error,
    }
  }

  return {
    data: ((data as User[]) ?? [])[0] ?? null,
    error: undefined,
  }
}

export const sbSetUserRole = async (
  userId: string,
  roleId: string,
): Promise<SingleSupabaseResponse<null>> => {
  const { error } = await supabase.rpc('set_user_role', {
    target_user_id: userId,
    target_role_id: roleId,
  })

  if (error) {
    console.error(error.code, error.message)
    return {
      data: null,
      error,
    }
  }

  return {
    data: null,
    error: undefined,
  }
}
