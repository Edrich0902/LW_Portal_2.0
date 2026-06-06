import type { GroupType } from '@/types/groupType.ts'

export type Group = {
  id: string
  title: string
  description: string
  type: GroupType
  whatsappLink?: string | null
  location?: string | null
  banner_url?: string | null
  banner_public_id?: string | null
  leader_count?: number
  member_count?: number
  pending_count?: number
  updated_at?: string
  created_at?: string
}
