export type RsvpStatus = 'attending' | 'interested' | 'not_attending'

export type EventRsvpDetail = {
  id: string
  event_id: string
  user_id: string
  status: RsvpStatus
  created_at: string
  first_name?: string
  last_name?: string
  email?: string
}

export type EventRsvpSummaryRow = {
  id: string
  title: string
  start_date?: string
  end_date?: string
  banner_public_id?: string
  capacity?: number
  attending_count: number
  interested_count: number
  not_attending_count: number
}
