import type { SupabaseClient, User } from '@supabase/supabase-js'

// ── Types referenced by Database (must come before it) ──────────────────────

export interface Milestone {
  id: number
  title: string
  completed: boolean
}

export interface WhatsAppPrefs {
  enabled: boolean
  phone: string | null
  dailyCheckInTime: string
  weeklySummaryDay: number
  weeklySummaryTime: string
  milestonesAlerts: boolean
}

// ── Database definition (all table types) ──────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          whatsapp_phone: string | null
          whatsapp_prefs: WhatsAppPrefs | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          whatsapp_phone?: string | null
          whatsapp_prefs?: WhatsAppPrefs | null
          created_at?: string
        }
        Update: {
          email?: string | null
          whatsapp_phone?: string | null
          whatsapp_prefs?: WhatsAppPrefs | null
        }
      }
      children: {
        Row: {
          id: string
          user_id: string
          name: string
          age: number | null
          sensitivities: string[]
          triggers: string[]
          strategies: string[]
          what_not_to_do: string[]
          communication_prefs: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          age?: number | null
          sensitivities?: string[]
          triggers?: string[]
          strategies?: string[]
          what_not_to_do?: string[]
          communication_prefs?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          name?: string
          age?: number | null
          sensitivities?: string[]
          triggers?: string[]
          strategies?: string[]
          what_not_to_do?: string[]
          communication_prefs?: Record<string, unknown>
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          child_id: string
          type: string
          value: string
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          child_id: string
          type: string
          value: string
          timestamp?: string
        }
        Update: {
          type?: string
          value?: string
        }
      }
      user_stats: {
        Row: {
          user_id: string
          streak: number
          total_sessions: number
          last_visit_date: string | null
          milestones: Milestone[]
        }
        Insert: {
          user_id: string
          streak?: number
          total_sessions?: number
          last_visit_date?: string | null
          milestones?: Milestone[]
        }
        Update: {
          streak?: number
          total_sessions?: number
          last_visit_date?: string | null
          milestones?: Milestone[]
        }
      }
      check_ins: {
        Row: {
          id: string
          user_id: string
          child_id: string
          sleep_quality: 'Great' | 'Okay' | 'Bad'
          routine_changes: boolean
          sensory_environment: 'Calm' | 'Loud' | 'Hectic'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          child_id: string
          sleep_quality: 'Great' | 'Okay' | 'Bad'
          routine_changes?: boolean
          sensory_environment: 'Calm' | 'Loud' | 'Hectic'
          created_at?: string
        }
        Update: {
          sleep_quality?: 'Great' | 'Okay' | 'Bad'
          routine_changes?: boolean
          sensory_environment?: 'Calm' | 'Loud' | 'Hectic'
        }
      }
      episodes: {
        Row: {
          id: string
          user_id: string
          child_id: string
          trigger: string
          behavior: string
          strategies_used: string[]
          strategies_effective: string[]
          outcome_successful: boolean
          duration_minutes: number | null
          parent_stress_level: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          child_id: string
          trigger: string
          behavior: string
          strategies_used?: string[]
          strategies_effective?: string[]
          outcome_successful?: boolean
          duration_minutes?: number | null
          parent_stress_level?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          trigger?: string
          behavior?: string
          strategies_used?: string[]
          strategies_effective?: string[]
          outcome_successful?: boolean
          duration_minutes?: number | null
          parent_stress_level?: number | null
          notes?: string | null
        }
      }
      strategies: {
        Row: {
          id: string
          child_id: string
          description: string
          category: string
          success_count: number
          failure_count: number
          last_used: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          child_id: string
          description: string
          category?: string
          success_count?: number
          failure_count?: number
          last_used?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          description?: string
          category?: string
          success_count?: number
          failure_count?: number
          last_used?: string | null
          notes?: string | null
        }
      }
      child_profile_access: {
        Row: {
          id: string
          user_id: string
          child_id: string
          role: 'primary' | 'caregiver' | 'therapist'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          child_id: string
          role?: 'primary' | 'caregiver' | 'therapist'
          created_at?: string
        }
        Update: {
          role?: 'primary' | 'caregiver' | 'therapist'
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          stripe_price_id: string | null
          status: string
          plan: 'free' | 'basic' | 'pro'
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          stripe_price_id?: string | null
          status?: string
          plan: 'free' | 'basic' | 'pro'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
        }
        Update: {
          stripe_customer_id?: string
          stripe_subscription_id?: string
          stripe_price_id?: string | null
          status?: string
          plan?: 'free' | 'basic' | 'pro'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

// ── Derived types ────────────────────────────────────────────────────────────

export type SupabaseClientType = SupabaseClient<Database>

export interface AuthUser extends User {
  user_metadata: {
    first_name?: string
    last_name?: string
    role?: 'parent' | 'therapist' | 'admin'
    avatar_url?: string
  }
}

export interface SessionContext {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  supabase: SupabaseClientType | null
}
