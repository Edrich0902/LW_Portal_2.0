import supabase from '@lib/supabaseClient.ts'
import type { SupabaseResponse, SingleSupabaseResponse } from '@/types/supabase-response.ts'
import type { PastoralPost } from '@/types/pastoral-blog/pastoral-post.ts'

export const sbQueryPastoralPosts = async (): Promise<SupabaseResponse<PastoralPost>> => {
  const { data, error, count } = await supabase
    .from('pastoral_posts_view')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .returns<PastoralPost[]>()

  if (error) {
    return { data: [], count: 0, error }
  }

  return { data: data ?? [], count: count ?? 0, error: undefined }
}

export const sbCreatePastoralPost = async (payload: {
  title: string
  content: string
  coverImageUrl?: string | null
  coverImagePublicId?: string | null
}): Promise<SingleSupabaseResponse<PastoralPost>> => {
  const { data, error } = await supabase.rpc('create_pastoral_post', {
    target_title: payload.title,
    target_content: payload.content,
    target_cover_image_url: payload.coverImageUrl ?? null,
    target_cover_image_public_id: payload.coverImagePublicId ?? null,
  })

  if (error) {
    return { data: null, error }
  }

  return { data: data as PastoralPost, error: undefined }
}

export const sbUpdatePastoralPost = async (
  postId: string,
  payload: {
    title: string
    content: string
    coverImageUrl?: string | null
    coverImagePublicId?: string | null
  },
): Promise<SingleSupabaseResponse<PastoralPost>> => {
  const { data, error } = await supabase.rpc('update_pastoral_post', {
    target_post_id: postId,
    target_title: payload.title,
    target_content: payload.content,
    target_cover_image_url: payload.coverImageUrl ?? null,
    target_cover_image_public_id: payload.coverImagePublicId ?? null,
  })

  if (error) {
    return { data: null, error }
  }

  return { data: data as PastoralPost, error: undefined }
}

export const sbSetPastoralPostPublished = async (
  postId: string,
  shouldPublish: boolean,
): Promise<SingleSupabaseResponse<void>> => {
  const { error } = await supabase.rpc('set_pastoral_post_published', {
    target_post_id: postId,
    should_publish: shouldPublish,
  })

  if (error) {
    return { data: null, error }
  }

  return { data: undefined, error: undefined }
}

export const sbDeletePastoralPost = async (
  postId: string,
): Promise<SingleSupabaseResponse<void>> => {
  const { error } = await supabase.rpc('delete_pastoral_post', {
    target_post_id: postId,
  })

  if (error) {
    return { data: null, error }
  }

  return { data: undefined, error: undefined }
}

export const sbGetLatestPastoralPost = async (): Promise<PastoralPost | null> => {
  const { data, error } = await supabase
    .from('pastoral_posts_view')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single<PastoralPost>()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching latest blog post:', error.code, error.message)
    }
    return null
  }

  return data
}

