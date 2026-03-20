/**
 * Database type convenience exports.
 * All types are derived from the Database type defined in lib/supabase/types.ts.
 * This file provides ergonomic aliases for use throughout the application.
 */

import type { Database } from '@/lib/supabase/types'

// ── Profile ──────────────────────────────────────────────────────────────────
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// ── Child ─────────────────────────────────────────────────────────────────────
export type Child = Database['public']['Tables']['children']['Row']
export type ChildInsert = Database['public']['Tables']['children']['Insert']
export type ChildUpdate = Database['public']['Tables']['children']['Update']

// ── Activity Log ───────────────────────────────────────────────────────────────
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
export type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert']
export type ActivityLogUpdate = Database['public']['Tables']['activity_logs']['Update']

// ── User Stats ─────────────────────────────────────────────────────────────────
export type UserStats = Database['public']['Tables']['user_stats']['Row']
export type UserStatsInsert = Database['public']['Tables']['user_stats']['Insert']
export type UserStatsUpdate = Database['public']['Tables']['user_stats']['Update']

// ── Milestone ──────────────────────────────────────────────────────────────────
export type Milestone = Database['public']['Tables']['user_stats']['Row']['milestones'][number]

// ── Check-in ───────────────────────────────────────────────────────────────────
export type CheckIn = Database['public']['Tables']['check_ins']['Row']
export type CheckInInsert = Database['public']['Tables']['check_ins']['Insert']
export type CheckInUpdate = Database['public']['Tables']['check_ins']['Update']

// ── Episode ─────────────────────────────────────────────────────────────────────
export type Episode = Database['public']['Tables']['episodes']['Row']
export type EpisodeInsert = Database['public']['Tables']['episodes']['Insert']
export type EpisodeUpdate = Database['public']['Tables']['episodes']['Update']

// ── Strategy ────────────────────────────────────────────────────────────────────
export type Strategy = Database['public']['Tables']['strategies']['Row']
export type StrategyInsert = Database['public']['Tables']['strategies']['Insert']
export type StrategyUpdate = Database['public']['Tables']['strategies']['Update']

// ── Child Profile Access (Care Team) ───────────────────────────────────────────
export type ChildProfileAccess = Database['public']['Tables']['child_profile_access']['Row']
export type ChildProfileAccessInsert = Database['public']['Tables']['child_profile_access']['Insert']
export type ChildProfileAccessUpdate = Database['public']['Tables']['child_profile_access']['Update']

export type CareTeamRole = ChildProfileAccess['role']

// ── Enum-like unions ───────────────────────────────────────────────────────────
export type SleepQuality = CheckIn['sleep_quality']
export type SensoryEnvironment = CheckIn['sensory_environment']

// ── Knowledge base (RAG) ────────────────────────────────────────────────────────
export interface KnowledgeDocument {
  id: string
  name: string
  doc_type: string
  chunk_count: number
  ingested_at: string
}
