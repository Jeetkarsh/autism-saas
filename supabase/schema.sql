-- NeuroBridge Database Schema
-- Run this in Supabase SQL Editor to set up the complete database

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. User Profiles Table
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  whatsapp_phone text,
  whatsapp_prefs jsonb default '{"enabled": false}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Children Table (with full profile wizard fields)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.children (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  age integer,
  sensitivities jsonb default '[]'::jsonb,
  triggers jsonb default '[]'::jsonb,
  strategies jsonb default '[]'::jsonb,
  what_not_to_do jsonb default '[]'::jsonb,
  communication_prefs jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Activity Logs Table
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  child_id uuid references public.children(id) on delete cascade not null,
  type text not null,
  value text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. User Stats / Streaks Table
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.user_stats (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  streak integer default 0,
  total_sessions integer default 0,
  last_visit_date date,
  milestones jsonb default '[]'::jsonb
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Daily Check-ins
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.check_ins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  child_id uuid references public.children(id) on delete cascade not null,
  sleep_quality text not null check (sleep_quality in ('Great', 'Okay', 'Bad')),
  routine_changes boolean default false,
  sensory_environment text not null check (sensory_environment in ('Calm', 'Loud', 'Hectic')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Crisis Episodes with duration + parent stress tracking
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.episodes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  child_id uuid references public.children(id) on delete cascade not null,
  trigger text not null,
  behavior text not null,
  strategies_used jsonb default '[]'::jsonb,
  strategies_effective jsonb default '[]'::jsonb,
  outcome_successful boolean default false,
  duration_minutes integer,
  parent_stress_level integer check (parent_stress_level >= 1 and parent_stress_level <= 10),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Strategy effectiveness tracking
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.strategies (
  id uuid default gen_random_uuid() primary key,
  child_id uuid references public.children(id) on delete cascade not null,
  description text not null,
  category text default 'general',
  success_count integer default 0,
  failure_count integer default 0,
  last_used timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Care team multi-user access
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.child_profile_access (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  child_id uuid references public.children(id) on delete cascade not null,
  role text default 'caregiver' check (role in ('primary', 'caregiver', 'therapist')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, child_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Set up Row Level Security (RLS)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.activity_logs enable row level security;
alter table public.user_stats enable row level security;
alter table public.check_ins enable row level security;
alter table public.episodes enable row level security;
alter table public.strategies enable row level security;
alter table public.child_profile_access enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. RLS Policies for Profiles
-- ─────────────────────────────────────────────────────────────────────────────
create policy "Profiles: users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles: users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles: users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. RLS Policies for Children
-- ─────────────────────────────────────────────────────────────────────────────
create policy "Children: users can view own children"
  on public.children for select
  using (auth.uid() = user_id);

create policy "Children: users can insert own children"
  on public.children for insert
  with check (auth.uid() = user_id);

create policy "Children: users can update own children"
  on public.children for update
  using (auth.uid() = user_id);

create policy "Children: users can delete own children"
  on public.children for delete
  using (auth.uid() = user_id);

-- Care team access to children
create policy "Children: care team members can view shared children"
  on public.children for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.child_profile_access
      where child_profile_access.child_id = children.id
      and child_profile_access.user_id = auth.uid()
    )
  );

create policy "Children: care team members can update shared children"
  on public.children for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.child_profile_access
      where child_profile_access.child_id = children.id
      and child_profile_access.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. RLS Policies for Activity Logs
-- ─────────────────────────────────────────────────────────────────────────────
create policy "Activity logs: users can view own logs"
  on public.activity_logs for select
  using (auth.uid() = user_id);

create policy "Activity logs: users can insert own logs"
  on public.activity_logs for insert
  with check (auth.uid() = user_id);

create policy "Activity logs: users can update own logs"
  on public.activity_logs for update
  using (auth.uid() = user_id);

create policy "Activity logs: users can delete own logs"
  on public.activity_logs for delete
  using (auth.uid() = user_id);

-- Care team access to activity logs
create policy "Activity logs: care team can view shared child logs"
  on public.activity_logs for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.child_profile_access
      where child_profile_access.child_id = activity_logs.child_id
      and child_profile_access.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. RLS Policies for User Stats
-- ─────────────────────────────────────────────────────────────────────────────
create policy "User stats: users can view own stats"
  on public.user_stats for select
  using (auth.uid() = user_id);

create policy "User stats: users can insert own stats"
  on public.user_stats for insert
  with check (auth.uid() = user_id);

create policy "User stats: users can update own stats"
  on public.user_stats for update
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. RLS Policies for Check-ins
-- ─────────────────────────────────────────────────────────────────────────────
create policy "Check-ins: users can manage own check-ins"
  on public.check_ins for all
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.child_profile_access
      where child_profile_access.child_id = check_ins.child_id
      and child_profile_access.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. RLS Policies for Episodes
-- ─────────────────────────────────────────────────────────────────────────────
create policy "Episodes: users can manage own episodes"
  on public.episodes for all
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.child_profile_access
      where child_profile_access.child_id = episodes.child_id
      and child_profile_access.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. RLS Policies for Strategies
-- ─────────────────────────────────────────────────────────────────────────────
create policy "Strategies: users can manage strategies for own children"
  on public.strategies for all
  using (
    exists (select 1 from public.children where children.id = strategies.child_id and children.user_id = auth.uid())
    or exists (
      select 1 from public.child_profile_access
      where child_profile_access.child_id = strategies.child_id
      and child_profile_access.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 17. RLS Policies for Child Profile Access
-- ─────────────────────────────────────────────────────────────────────────────
create policy "Child profile access: users can manage own access bindings"
  on public.child_profile_access for all
  using (auth.uid() = user_id);

create policy "Child profile access: primary caregivers can view access bindings"
  on public.child_profile_access for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.children
      where children.id = child_profile_access.child_id
      and children.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 18. Auto-create profile + user_stats on new user registration
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.user_stats (user_id, milestones)
  values (
    new.id,
    '[{"id": 1, "title": "First Check-in", "completed": false}, {"id": 2, "title": "7-Day Streak", "completed": false}, {"id": 3, "title": "10 Sessions", "completed": false}, {"id": 4, "title": "First Activity Log", "completed": false}, {"id": 5, "title": "Explore Resources", "completed": false}]'::jsonb
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 19. Indexes for performance
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists idx_children_user_id on public.children(user_id);
create index if not exists idx_activity_logs_user_id on public.activity_logs(user_id);
create index if not exists idx_activity_logs_child_id on public.activity_logs(child_id);
create index if not exists idx_activity_logs_timestamp on public.activity_logs(timestamp desc);
create index if not exists idx_check_ins_child_id on public.check_ins(child_id);
create index if not exists idx_check_ins_created_at on public.check_ins(created_at desc);
create index if not exists idx_episodes_child_id on public.episodes(child_id);
create index if not exists idx_episodes_created_at on public.episodes(created_at desc);
create index if not exists idx_strategies_child_id on public.strategies(child_id);
create index if not exists idx_child_profile_access_user_id on public.child_profile_access(user_id);
create index if not exists idx_child_profile_access_child_id on public.child_profile_access(child_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 20. Waitlist Table (email sequence tracking)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  name text,
  referral_source text,
  subscribed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Email sequence state machine: 1 (day-1 sent), 3 (day-3 sent), 7 (day-7 sent)
  email_sequence_day integer default 1,
  email_sent_at timestamp with time zone,
  converted boolean default false,
  converted_at timestamp with time zone
);

alter table public.waitlist enable row level security;

-- Anyone can subscribe (no auth required); service role used by cron
create policy "Waitlist: anyone can subscribe"
  on public.waitlist for insert
  with check (true);

create policy "Waitlist: service role can view all"
  on public.waitlist for select
  using (true);

create policy "Waitlist: service role can update (cron advances sequence)"
  on public.waitlist for update
  using (true);

create index if not exists idx_waitlist_email_sequence
  on public.waitlist(email_sequence_day, converted)
  where converted = false;
