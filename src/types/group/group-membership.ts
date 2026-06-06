export enum GroupMembershipRole {
  LEADER = 'leader',
  MEMBER = 'member',
}

export enum GroupMembershipStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  DECLINED = 'declined',
  LEFT = 'left',
  REMOVED = 'removed',
}

export type GroupMembership = {
  id: string
  group_id: string
  user_id: string
  role: GroupMembershipRole
  status: GroupMembershipStatus
  requested_at?: string | null
  responded_at?: string | null
  responded_by?: string | null
  joined_at?: string | null
  created_at?: string
  updated_at?: string
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  email?: string | null
  profile_public_id?: string | null
  profile_url?: string | null
  responded_by_first_name?: string | null
  responded_by_last_name?: string | null
  responded_by_full_name?: string | null
}

export type GroupMembershipCandidate = {
  id: string
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  email: string
  profile_public_id?: string | null
  profile_url?: string | null
}
