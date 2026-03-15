export interface ChildProfile {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  sensitivities: string[];
  triggers: string[];
  strategies: string[];
  what_not_to_do: string[];
  communication_prefs: Record<string, unknown>;
  created_at?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  child_id: string;
  type: string;
  value: string;
  timestamp: string;
}

export interface Milestone {
  id: number;
  title: string;
  completed: boolean;
}

export interface UserStats {
  user_id: string;
  streak: number;
  last_visit_date: string | null;
  total_sessions: number;
  milestones: Milestone[];
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  doc_type: string;
  chunk_count: number;
  ingested_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  child_id: string;
  sleep_quality: 'Great' | 'Okay' | 'Bad';
  routine_changes: boolean;
  sensory_environment: 'Calm' | 'Loud' | 'Hectic';
  created_at: string;
}

export interface Episode {
  id: string;
  user_id: string;
  child_id: string;
  trigger: string;
  behavior: string;
  strategies_used: string[];
  strategies_effective: string[];
  outcome_successful: boolean;
  duration_minutes: number | null;
  parent_stress_level: number | null;
  notes: string | null;
  created_at: string;
}

export interface Strategy {
  id: string;
  child_id: string;
  description: string;
  category: string;
  success_count: number;
  failure_count: number;
  last_used: string | null;
  notes: string | null;
  created_at: string;
}

export interface ChildProfileAccess {
  id: string;
  user_id: string;
  child_id: string;
  role: 'primary' | 'caregiver' | 'therapist';
  created_at: string;
}
