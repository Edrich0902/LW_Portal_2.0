export type PrayerRequest = {
  id?: string
  user_id?: string
  first_name?: string
  last_name?: string
  email?: string
  category: string
  body: string
  is_anonymous: boolean
  status: PrayerRequestStatus
  moderation_note?: string
  approved_at?: string | null
  approved_by?: string | null
  rejected_at?: string | null
  rejected_by?: string | null
  resolved_at?: string | null
  resolved_by?: string | null
  created_at?: string
  updated_at?: string
  reaction_count?: number
}

export enum PrayerRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RESOLVED = 'resolved',
}

export enum PrayerCategory {
  HEALING = 'healing',
  FAMILY = 'family',
  PROVISION = 'provision',
  GUIDANCE = 'guidance',
  SPIRITUAL_GROWTH = 'spiritual_growth',
  THANKSGIVING = 'thanksgiving',
  OTHER = 'other',
}

export const prayerCategoryLabels: Record<PrayerCategory, string> = {
  [PrayerCategory.HEALING]: 'Healing',
  [PrayerCategory.FAMILY]: 'Family',
  [PrayerCategory.PROVISION]: 'Provision',
  [PrayerCategory.GUIDANCE]: 'Guidance',
  [PrayerCategory.SPIRITUAL_GROWTH]: 'Spiritual Growth',
  [PrayerCategory.THANKSGIVING]: 'Thanksgiving',
  [PrayerCategory.OTHER]: 'Other',
}

export const prayerStatusLabels: Record<PrayerRequestStatus, string> = {
  [PrayerRequestStatus.PENDING]: 'Pending',
  [PrayerRequestStatus.APPROVED]: 'Approved',
  [PrayerRequestStatus.REJECTED]: 'Rejected',
  [PrayerRequestStatus.RESOLVED]: 'Resolved',
}
