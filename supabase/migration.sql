-- NeuroBridge Feature Integration: Schema Migration
-- Run this in Supabase SQL Editor

-- 1. Extend children table with profile wizard fields
ALTER TABLE children ADD COLUMN IF NOT EXISTS sensitivities jsonb DEFAULT '[]';
ALTER TABLE children ADD COLUMN IF NOT EXISTS triggers jsonb DEFAULT '[]';
ALTER TABLE children ADD COLUMN IF NOT EXISTS strategies jsonb DEFAULT '[]';
ALTER TABLE children ADD COLUMN IF NOT EXISTS what_not_to_do jsonb DEFAULT '[]';
ALTER TABLE children ADD COLUMN IF NOT EXISTS communication_prefs jsonb DEFAULT '{}';

-- 2. Daily check-ins
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  sleep_quality text NOT NULL,
  routine_changes boolean DEFAULT false,
  sensory_environment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Crisis episodes with duration + parent stress tracking
CREATE TABLE IF NOT EXISTS episodes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  trigger text NOT NULL,
  behavior text NOT NULL,
  strategies_used jsonb DEFAULT '[]',
  strategies_effective jsonb DEFAULT '[]',
  outcome_successful boolean DEFAULT false,
  duration_minutes int,
  parent_stress_level int,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 4. Strategy effectiveness tracking
CREATE TABLE IF NOT EXISTS strategies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  description text NOT NULL,
  category text DEFAULT 'general',
  success_count int DEFAULT 0,
  failure_count int DEFAULT 0,
  last_used timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 5. Care team multi-user access
CREATE TABLE IF NOT EXISTS child_profile_access (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  role text DEFAULT 'caregiver',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, child_id)
);

-- Enable RLS
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_profile_access ENABLE ROW LEVEL SECURITY;

-- RLS policies (user can access own data or data shared via care team)
CREATE POLICY "Users can manage own check_ins" ON check_ins FOR ALL USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM child_profile_access WHERE child_profile_access.child_id = check_ins.child_id AND child_profile_access.user_id = auth.uid())
);
CREATE POLICY "Users can manage own episodes" ON episodes FOR ALL USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM child_profile_access WHERE child_profile_access.child_id = episodes.child_id AND child_profile_access.user_id = auth.uid())
);
CREATE POLICY "Users can manage strategies for own children" ON strategies FOR ALL USING (
  child_id IN (SELECT id FROM children WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM child_profile_access WHERE child_profile_access.child_id = strategies.child_id AND child_profile_access.user_id = auth.uid())
);
CREATE POLICY "Users can manage own access bindings" ON child_profile_access FOR ALL USING (auth.uid() = user_id);
