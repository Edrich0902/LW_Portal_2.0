import type { EventRsvpDetail, EventRsvpSummaryRow } from '@/types/event-rsvp/event-rsvp.ts'
import supabase from '@lib/supabaseClient.ts'

export const sbGetEventRsvpSummary = async (): Promise<EventRsvpSummaryRow[]> => {
  const today = new Date().toISOString().split('T')[0]

  const [eventsRes, summaryRes] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, start_date, end_date, banner_public_id, capacity')
      .eq('type', 'once')
      .gte('start_date', today)
      .order('start_date', { ascending: true }),
    supabase.from('event_rsvp_summary').select('*'),
  ])

  if (eventsRes.error) {
    console.error(eventsRes.error.code, eventsRes.error.message)
    return []
  }

  const summaryMap = new Map(
    (summaryRes.data ?? []).map((s) => [s.event_id, s]),
  )

  return (eventsRes.data ?? []).map((event) => {
    const summary = summaryMap.get(event.id)
    return {
      id: event.id,
      title: event.title,
      start_date: event.start_date,
      end_date: event.end_date,
      banner_public_id: event.banner_public_id,
      capacity: event.capacity,
      attending_count: summary?.attending_count ?? 0,
      interested_count: summary?.interested_count ?? 0,
      not_attending_count: summary?.not_attending_count ?? 0,
    }
  })
}

export const sbGetEventRsvpDetails = async (eventId: string): Promise<EventRsvpDetail[]> => {
  const { data, error } = await supabase
    .from('event_rsvp_details_view')
    .select('*')
    .eq('event_id', eventId)
    .order('status', { ascending: true })
    .order('created_at', { ascending: true })
    .returns<EventRsvpDetail[]>()

  if (error) {
    console.error(error.code, error.message)
    return []
  }

  return data ?? []
}
