import supabase from '@lib/supabaseClient.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { SupabaseResponse, SingleSupabaseResponse } from '@/types/supabase-response.ts'
import type { Group } from '@/types/group/group.ts'

export const sbQueryConnectServeGroups = async (
  pagination: LwpPagination,
  sort: LwpSort,
  filter?: LwpFilter,
): Promise<SupabaseResponse<Group>> => {
  const query = supabase.from('groups').select('*', { count: 'exact' })

  if (filter) {
    if (filter.searchText.trim())
      query.textSearch('title', formatSearchText(filter.searchText), {
        type: 'websearch',
        config: 'english',
      })
  }

  const { data, error, count } = await query
    .range(pagination.from, pagination.to)
    .order(sort.column, { ascending: sort.order == 'asc' })
    .returns<Group[]>()

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

export const sbCreateConnectServeGroup = async (
  group: Group,
): Promise<SingleSupabaseResponse<Group>> => {
  const { data, error } = await supabase.from('groups').insert(group).single<Group>()

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

export const sbUpdateConnectServeGroup = async (
  group: Group,
): Promise<SingleSupabaseResponse<Group>> => {
  const { data, error } = await supabase
    .from('groups')
    .update(group)
    .eq('id', group.id)
    .single<Group>()

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

export const sbDeleteConnectServeGroup = async (
  group: Group,
): Promise<SingleSupabaseResponse<Group>> => {
  const { data, error } = await supabase.from('groups').delete().eq('id', group.id).single<Group>()

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
