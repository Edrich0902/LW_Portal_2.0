import supabase from '@lib/supabaseClient.ts';
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { SupabaseResponse, SingleSupabaseResponse } from '@/types/supabase-response.ts'
import type { Announcement } from '@/types/announcement/announcement.ts';

export const sbQueryAnnouncements = async (
  pagination: LwpPagination,
  sort: LwpSort,
  filter?: LwpFilter,
): Promise<SupabaseResponse<Announcement>> => {
  const query = supabase.from('announcements').select('*', { count: 'exact' })

  if (filter) {
    if (filter.searchText.trim()) query.textSearch('title', formatSearchText(filter.searchText), { type: 'websearch', config: 'english' })
  }

  const { data, error, count } = await query
    .range(pagination.from, pagination.to)
    .order(sort.column, { ascending: sort.order == 'asc' })
    .returns<Announcement[]>()

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

export const sbCreateAnnouncement = async (
  announcement: Announcement,
): Promise<SingleSupabaseResponse<Announcement>> => {
  const { data, error } = await supabase
    .from('announcements')
    .insert(announcement)
    .single<Announcement>()

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

export const sbUpdateAnnouncement = async (
  announcement: Announcement,
): Promise<SingleSupabaseResponse<Announcement>> => {
  const { data, error } = await supabase
    .from('announcements')
    .update(announcement)
    .eq('id', announcement.id)
    .single<Announcement>()

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

export const sbDeleteAnnouncement = async (
  announcement: Announcement,
): Promise<SingleSupabaseResponse<Announcement>> => {
  const { data, error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', announcement.id)
    .single<Announcement>()

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

export const sbGetPendingAnnouncementsCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true })
    .eq('state', AnnouncementState.PENDING)

  if (error) {
    console.error(error.code, error.message)
    return 0
  }

  return count ?? 0
}

export const sbGetLatestAnnouncements = async (limit: number = 5): Promise<Announcement[]> => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
    .returns<Announcement[]>()

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


// TODO: possibly add new function here to handle sending of notification
