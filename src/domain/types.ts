export interface SessionMetadata {
  focusDurationSec: number
  breakDurationSec: number
  completedAt: string | null
}

export interface Flow {
  id: string
  createdAt: string
  updatedAt: string
  goal: string
  contentHtml: string
  tags: string[]
  session: SessionMetadata
}

export type TimeBucket = 'hour' | 'day' | 'month' | 'year'
