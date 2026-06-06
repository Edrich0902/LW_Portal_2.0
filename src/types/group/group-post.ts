export type GroupPost = {
  id: string
  group_id: string
  author_user_id: string
  title?: string | null
  content: string
  is_pinned: boolean
  created_at: string
  updated_at: string
  author_first_name?: string | null
  author_last_name?: string | null
  author_full_name?: string | null
  author_profile_public_id?: string | null
  author_profile_url?: string | null
  reaction_count?: number
  amen_count?: number
  prayer_count?: number
  heart_count?: number
  current_user_reaction?: string | null
  is_author?: boolean
}
