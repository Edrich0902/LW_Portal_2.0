export type PrayerRequestNote = {
  id: string
  prayer_request_id: string
  author_user_id: string
  body: string
  created_at: string
  updated_at: string
  author_first_name?: string | null
  author_last_name?: string | null
  author_full_name?: string | null
}
