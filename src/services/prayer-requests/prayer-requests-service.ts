import { PrayerRequestStatus, type PrayerRequest } from '@/types/prayer-request/prayer-request.ts'
import type { PrayerRequestNote } from '@/types/prayer-request/prayer-request-note.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { SupabaseResponse, SingleSupabaseResponse } from '@/types/supabase-response.ts'
import supabase from '@lib/supabaseClient.ts'

export const sbQueryPrayerRequests = async (
  pagination: LwpPagination,
  sort: LwpSort,
  filter?: LwpFilter & { status?: string; category?: string; isPrivate?: string },
): Promise<SupabaseResponse<PrayerRequest>> => {
  const query = supabase.from('prayer_requests_admin_view').select('*', { count: 'exact' })

  if (filter?.searchText.trim()) {
    const term = filter.searchText.trim()
    query.or(
      `body.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`,
    )
  }

  if (filter?.status?.trim()) query.eq('status', filter.status)
  if (filter?.category?.trim()) query.eq('category', filter.category)
  if (filter?.isPrivate === 'true') query.eq('is_private', true)
  if (filter?.isPrivate === 'false') query.eq('is_private', false)

  const { data, error, count } = await query
    .range(pagination.from, pagination.to)
    .order(sort.column, { ascending: sort.order === 'asc' })
    .returns<PrayerRequest[]>()

  if (error) {
    console.error(error.code, error.message)
    return {
      data: [],
      error,
      count: count ?? 0,
    }
  }

  return {
    data: data ?? [],
    error: undefined,
    count: count ?? 0,
  }
}

export const sbUpdatePrayerRequest = async (
  prayerRequest: PrayerRequest,
): Promise<SingleSupabaseResponse<PrayerRequest>> => {
  const { data, error } = await supabase
    .from('prayer_requests')
    .update(prayerRequest)
    .eq('id', prayerRequest.id)
    .select()
    .single<PrayerRequest>()

  if (error) {
    console.error(error.code, error.message)
    return {
      data: null,
      error,
    }
  }

  return {
    data,
    error: undefined,
  }
}

export const sbGetPrayerRequestCounts = async () => {
  const statuses = Object.values({
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    resolved: 'resolved',
  })

  const counts = await Promise.all(
    statuses.map((status) =>
      supabase
        .from('prayer_requests_admin_view')
        .select('*', { count: 'exact', head: true })
        .eq('status', status),
    ),
  )

  return {
    pending: counts[0].count ?? 0,
    approved: counts[1].count ?? 0,
    rejected: counts[2].count ?? 0,
    resolved: counts[3].count ?? 0,
  }
}

export const buildModerationPayload = (
  prayerRequest: PrayerRequest,
  status: PrayerRequestStatus,
  userId: string,
  moderationNote?: string,
): PrayerRequest => {
  const now = new Date().toISOString()
  const payload: PrayerRequest = {
    id: prayerRequest.id,
    status,
    moderation_note: moderationNote ?? prayerRequest.moderation_note,
    updated_at: now,
  } as PrayerRequest

  if (status === PrayerRequestStatus.APPROVED) {
    payload.approved_at = now
    payload.approved_by = userId
    payload.rejected_at = null
    payload.rejected_by = null
    payload.resolved_at = null
    payload.resolved_by = null
  }

  if (status === PrayerRequestStatus.REJECTED) {
    payload.rejected_at = now
    payload.rejected_by = userId
  }

  if (status === PrayerRequestStatus.RESOLVED) {
    payload.resolved_at = now
    payload.resolved_by = userId
  }

  return payload
}

export const sbFetchPrayerRequestNotes = async (
  prayerRequestId: string,
): Promise<SupabaseResponse<PrayerRequestNote>> => {
  const { data, error, count } = await supabase
    .from('prayer_request_notes_view')
    .select('*', { count: 'exact' })
    .eq('prayer_request_id', prayerRequestId)
    .order('created_at', { ascending: true })
    .returns<PrayerRequestNote[]>()

  if (error) {
    console.error(error.code, error.message)
    return { data: [], count: 0, error }
  }

  return { data: data ?? [], count: count ?? 0, error: undefined }
}

export const sbAddPrayerRequestNote = async (
  prayerRequestId: string,
  body: string,
  authorUserId: string,
): Promise<SingleSupabaseResponse<PrayerRequestNote>> => {
  const { data, error } = await supabase
    .from('prayer_request_notes')
    .insert({ prayer_request_id: prayerRequestId, body: body.trim(), author_user_id: authorUserId })
    .select()
    .single<PrayerRequestNote>()

  if (error) {
    console.error(error.code, error.message)
    return { data: null, error }
  }

  return { data, error: undefined }
}

export const sbDeletePrayerRequestNote = async (
  noteId: string,
): Promise<SingleSupabaseResponse<null>> => {
  const { error } = await supabase.from('prayer_request_notes').delete().eq('id', noteId)

  if (error) {
    console.error(error.code, error.message)
    return { data: null, error }
  }

  return { data: null, error: undefined }
}

export const sbTogglePrayerRequestPrivate = async (
  id: string,
  isPrivate: boolean,
): Promise<SingleSupabaseResponse<PrayerRequest>> => {
  const { data, error } = await supabase
    .from('prayer_requests')
    .update({ is_private: isPrivate, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single<PrayerRequest>()

  if (error) {
    console.error(error.code, error.message)
    return { data: null, error }
  }

  return { data, error: undefined }
}
