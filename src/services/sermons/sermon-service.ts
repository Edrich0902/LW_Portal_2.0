import supabase from '@lib/supabaseClient.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { SupabaseResponse, SingleSupabaseResponse } from '@/types/supabase-response.ts'
import type { Sermon } from '@/types/sermon/sermon.ts'

export const sbQuerySermons = async (
  pagination: LwpPagination,
  sort: LwpSort,
  filter?: LwpFilter,
): Promise<SupabaseResponse<Sermon>> => {
  const query = supabase.from('sermons').select('*', { count: 'exact' })

  if (filter) {
    if (filter.searchText.trim()) query.textSearch('title', formatSearchText(filter.searchText), { type: 'websearch', config: 'english' })
  }

  const { data, error, count } = await query
    .range(pagination.from, pagination.to)
    .order(sort.column, { ascending: sort.order == 'asc' })
    .returns<Sermon[]>()

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

export const sbCreateSermon = async (sermon: Sermon): Promise<SingleSupabaseResponse<Sermon>> => {
  const { data, error } = await supabase.from('sermons').insert(sermon).single<Sermon>()

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

export const sbUpdateSermon = async (sermon: Sermon): Promise<SingleSupabaseResponse<Sermon>> => {
  const { data, error } = await supabase
    .from('sermons')
    .update(sermon)
    .eq('id', sermon.id)
    .single<Sermon>()

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

export const sbDeleteSermon = async (sermon: Sermon): Promise<SingleSupabaseResponse<Sermon>> => {
  const { data, error } = await supabase
    .from('sermons')
    .delete()
    .eq('id', sermon.id)
    .single<Sermon>()

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

export const sbGetLatestSermon = async (): Promise<Sermon | null> => {
  const { data, error } = await supabase
    .from('sermons')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single<Sermon>()

  if (error) {
    if (error.code !== 'PGRST116') { // No rows found is fine
      console.error(error.code, error.message)
    }
    return null
  }

  return data
}

const formatSearchText = (searchText: string, and = false) => {
  const split = searchText.split(' ')
  const quotedParts = split.map((part) => `'${part.trim()}'`)

  if (and) return quotedParts.join(' & ')
  else return quotedParts.join(' | ')
}
