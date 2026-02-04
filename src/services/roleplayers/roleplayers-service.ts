import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { Roleplayer } from '@/types/roleplayer/roleplayer.ts'
import type { SupabaseResponse, SingleSupabaseResponse } from '@/types/supabase-response.ts'
import supabase from '@lib/supabaseClient.ts'

export const sbQueryRoleplayers = async (
  pagination: LwpPagination,
  sort: LwpSort,
  filter?: LwpFilter,
): Promise<SupabaseResponse<Roleplayer>> => {
  const query = supabase.from('roleplayers').select('*', { count: 'exact' })

  if (filter) {
    if (filter.searchText.trim())
      query.textSearch('fullname', formatSearchText(filter.searchText), {
        type: 'websearch',
        config: 'english',
      })
  }

  const { data, error, count } = await query
    .range(pagination.from, pagination.to)
    .order(sort.column, { ascending: sort.order == 'asc' })
    .returns<Roleplayer[]>()

  if (error) {
    console.error(error.code, error.message)
    return {
      data: [],
      error: error,
      count: count ?? 0,
    }
  }

  return {
    data: data,
    error: undefined,
    count: count ?? 0,
  }
}

export const sbCreateRoleplayer = async (
  roleplayer: Roleplayer,
): Promise<SingleSupabaseResponse<Roleplayer>> => {
  const { data, error } = await supabase.from('roleplayers').insert(roleplayer).single<Roleplayer>()

  if (error) {
    console.error(error.code, error.message)
    return {
      data: null,
      error: error,
    }
  }

  return {
    data: data,
    error: undefined,
  }
}

export const sbUpdateRoleplayer = async (
  roleplayer: Roleplayer,
): Promise<SingleSupabaseResponse<Roleplayer>> => {
  const { data, error } = await supabase
    .from('roleplayers')
    .update(roleplayer)
    .eq('id', roleplayer.id)
    .single<Roleplayer>()

  if (error) {
    console.error(error.code, error.message)
    return {
      data: null,
      error: error,
    }
  }

  return {
    data: data,
    error: undefined,
  }
}

export const sbDeleteRoleplayer = async (
  roleplayer: Roleplayer,
): Promise<SingleSupabaseResponse<Roleplayer>> => {
  const { data, error } = await supabase
    .from('roleplayers')
    .delete()
    .eq('id', roleplayer.id)
    .single<Roleplayer>()

  if (error) {
    console.error(error.code, error.message)
    return {
      data: null,
      error: error,
    }
  }

  return {
    data: data,
    error: undefined,
  }
}

const formatSearchText = (searchText: string, and = false) => {
  const split = searchText.split(' ')
  const quotedParts = split.map((part) => `'${part.trim()}'`)

  if (and) return quotedParts.join(' & ')
  else return quotedParts.join(' | ')
}
