export type AppFeedback = {
  id?: string
  user_id?: string
  first_name?: string
  last_name?: string
  email?: string
  category: FeedbackCategory
  title: string
  body: string
  status: FeedbackStatus
  admin_note?: string | null
  device_os?: string | null
  device_model?: string | null
  app_version?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  resolved_by?: string | null
  resolved_at?: string | null
  created_at?: string
  updated_at?: string
}

export enum FeedbackCategory {
  BUG_REPORT = 'bug_report',
  FEATURE_REQUEST = 'feature_request',
  IMPROVEMENT = 'improvement',
  OTHER = 'other',
}

export enum FeedbackStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  PLANNED = 'planned',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export const feedbackCategoryLabels: Record<FeedbackCategory, string> = {
  [FeedbackCategory.BUG_REPORT]: 'Bug Report',
  [FeedbackCategory.FEATURE_REQUEST]: 'Feature Request',
  [FeedbackCategory.IMPROVEMENT]: 'Improvement',
  [FeedbackCategory.OTHER]: 'Other',
}

export const feedbackStatusLabels: Record<FeedbackStatus, string> = {
  [FeedbackStatus.OPEN]: 'Open',
  [FeedbackStatus.UNDER_REVIEW]: 'Under Review',
  [FeedbackStatus.PLANNED]: 'Planned',
  [FeedbackStatus.RESOLVED]: 'Resolved',
  [FeedbackStatus.CLOSED]: 'Closed',
}

export type AppFeedbackFilter = {
  searchText: string
  status: string
  category: string
}
