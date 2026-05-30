import { FeedbackStatus, type AppFeedback, type AppFeedbackFilter } from '@/types/app-feedback/app-feedback.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { SupabaseResponse, SingleSupabaseResponse } from '@/types/supabase-response.ts'
import supabase from '@lib/supabaseClient.ts'

export const sbQueryAppFeedback = async (
  pagination: LwpPagination,
  sort: LwpSort,
  filter?: AppFeedbackFilter,
): Promise<SupabaseResponse<AppFeedback>> => {
  const query = supabase.from('app_feedback_admin_view').select('*', { count: 'exact' })

  if (filter?.searchText.trim()) {
    const term = filter.searchText.trim()
    query.or(
      `title.ilike.%${term}%,body.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`,
    )
  }

  if (filter?.status?.trim()) query.eq('status', filter.status)
  if (filter?.category?.trim()) query.eq('category', filter.category)

  const { data, error, count } = await query
    .range(pagination.from, pagination.to)
    .order(sort.column, { ascending: sort.order === 'asc' })
    .returns<AppFeedback[]>()

  if (error) {
    console.error(error.code, error.message)
    return { data: [], error, count: count ?? 0 }
  }

  return { data: data ?? [], error: undefined, count: count ?? 0 }
}

export const sbUpdateAppFeedback = async (
  payload: Partial<AppFeedback> & { id: string },
): Promise<SingleSupabaseResponse<AppFeedback>> => {
  const { data, error } = await supabase
    .from('app_feedback')
    .update(payload)
    .eq('id', payload.id)
    .select()
    .single<AppFeedback>()

  if (error) {
    console.error(error.code, error.message)
    return { data: null, error }
  }

  return { data, error: undefined }
}

export const sbGetAppFeedbackCounts = async () => {
  const statuses = Object.values(FeedbackStatus)

  const counts = await Promise.all(
    statuses.map((status) =>
      supabase
        .from('app_feedback_admin_view')
        .select('*', { count: 'exact', head: true })
        .eq('status', status),
    ),
  )

  return {
    [FeedbackStatus.OPEN]: counts[0].count ?? 0,
    [FeedbackStatus.UNDER_REVIEW]: counts[1].count ?? 0,
    [FeedbackStatus.PLANNED]: counts[2].count ?? 0,
    [FeedbackStatus.RESOLVED]: counts[3].count ?? 0,
    [FeedbackStatus.CLOSED]: counts[4].count ?? 0,
  }
}

export const buildFeedbackUpdatePayload = (
  feedback: AppFeedback,
  status: FeedbackStatus,
  userId: string,
  adminNote?: string,
): Partial<AppFeedback> & { id: string } => {
  const now = new Date().toISOString()
  const payload: Partial<AppFeedback> & { id: string } = {
    id: feedback.id!,
    status,
    admin_note: adminNote ?? feedback.admin_note,
    updated_at: now,
  }

  if (
    status !== FeedbackStatus.OPEN &&
    feedback.status === FeedbackStatus.OPEN
  ) {
    payload.reviewed_at = now
    payload.reviewed_by = userId
  }

  if (status === FeedbackStatus.RESOLVED) {
    payload.resolved_at = now
    payload.resolved_by = userId
  }

  return payload
}
