import supabase from '@lib/supabaseClient.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { SupabaseResponse, SingleSupabaseResponse } from '@/types/supabase-response.ts'
import type { SocialMedia } from '@/types/social-media/social-media.ts'

export const sbQuerySocialMedia = async (
  pagination: LwpPagination,
  sort: LwpSort,
  filter?: LwpFilter,
): Promise<SupabaseResponse<SocialMedia>> => {
  const query = supabase.from('social_media').select('*', { count: 'exact' })

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
    .returns<SocialMedia[]>()

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

export const sbCreateSocialMedia = async (
  socialMedia: SocialMedia,
): Promise<SingleSupabaseResponse<SocialMedia>> => {
  const { data, error } = await supabase
    .from('social_media')
    .insert(socialMedia)
    .single<SocialMedia>()

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

export const sbUpdateSocialMedia = async (
  socialMedia: SocialMedia,
): Promise<SingleSupabaseResponse<SocialMedia>> => {
  const { data, error } = await supabase
    .from('social_media')
    .update(socialMedia)
    .eq('id', socialMedia.id)
    .single<SocialMedia>()

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

export const sbDeleteSocialMedia = async (
  socialMedia: SocialMedia,
): Promise<SingleSupabaseResponse<SocialMedia>> => {
  const { data, error } = await supabase
    .from('social_media')
    .delete()
    .eq('id', socialMedia.id)
    .single<SocialMedia>()

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
