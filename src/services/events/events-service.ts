import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { Event } from '@/types/event/event.ts';
import type { SupabaseResponse, SingleSupabaseResponse } from '@/types/supabase-response.ts'
import supabase from '@lib/supabaseClient.ts'

export const sbQueryEvents = async (
  pagination: LwpPagination,
  sort: LwpSort,
  filter?: LwpFilter,
): Promise<SupabaseResponse<Event>> => {
  const query = supabase.from('events').select('*', { count: 'exact' })

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
    .returns<Event[]>()

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

export const sbCreateEvent = async (event: Event): Promise<SingleSupabaseResponse<Event>> => {
  const { data, error } = await supabase.from('events').insert(event).single<Event>()

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

export const sbUpdateEvent = async (event: Event): Promise<SingleSupabaseResponse<Event>> => {
  const { data, error } = await supabase
    .from('events')
    .update(event)
    .eq('id', event.id)
    .single<Event>()

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

export const sbDeleteEvent = async (event: Event): Promise<SingleSupabaseResponse<Event>> => {
  const { data, error } = await supabase.from('events').delete().eq('id', event.id).single<Event>()

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

export const sbFetchAllEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .returns<Event[]>()

  if (error) {
    console.error(error.code, error.message)
    return []
  }

  return data ?? []
}

const formatSearchText = (searchText: string, and = false) => {
  const split = searchText.split(' ')
  const quotedParts = split.map((part) => `'${part.trim()}'`)

  if (and) return quotedParts.join(' & ')
  else return quotedParts.join(' | ')
}
