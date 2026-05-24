import supabase from '@lib/supabaseClient.ts'
import type { Role } from '@/types/role/role.ts'
import type { SingleSupabaseResponse, SupabaseResponse } from '@/types/supabase-response.ts'

export const sbQueryRoles = async (): Promise<SupabaseResponse<Role>> => {
  const { data, error, count } = await supabase
    .from('roles')
    .select('*', { count: 'exact' })
    .order('role', { ascending: true })
    .returns<Role[]>()

  if (error) {
    console.error(error.code, error.message)
    return {
      data: [],
      count: count ?? 0,
      error,
    }
  }

  return {
    data: data ?? [],
    count: count ?? 0,
    error: undefined,
  }
}

export const sbCreateRole = async (roleName: string): Promise<SingleSupabaseResponse<Role>> => {
  const { data, error } = await supabase.rpc('create_role', {
    role_name: roleName,
  })

  if (error) {
    console.error(error.code, error.message)
    return {
      data: null,
      error,
    }
  }

  return {
    data: data as Role,
    error: undefined,
  }
}
