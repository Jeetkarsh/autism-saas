-- User Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Children Table
create table public.children (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  age integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Activity Logs Table
create table public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  child_id uuid references public.children(id) on delete cascade not null,
  type text not null, -- 'mood', 'speech', 'therapy'
  value text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Stats / Streaks Table
create table public.user_stats (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  streak integer default 0,
  total_sessions integer default 0,
  last_visit_date date,
  milestones jsonb default '[]'::jsonb
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.activity_logs enable row level security;
alter table public.user_stats enable row level security;

-- Policies for Profiles
create policy "Users can view own profile."
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can insert own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Policies for Children
create policy "Users can view own children."
  on public.children for select
  using ( auth.uid() = user_id );

create policy "Users can insert own children."
  on public.children for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own children."
  on public.children for update
  using ( auth.uid() = user_id );

-- Policies for Activity Logs
create policy "Users can view own activity logs."
  on public.activity_logs for select
  using ( auth.uid() = user_id );

create policy "Users can insert own activity logs."
  on public.activity_logs for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own activity logs."
  on public.activity_logs for update
  using ( auth.uid() = user_id );

create policy "Users can delete own activity logs."
  on public.activity_logs for delete
  using ( auth.uid() = user_id );

-- Policies for User Stats
create policy "Users can view own stats."
  on public.user_stats for select
  using ( auth.uid() = user_id );

create policy "Users can insert own stats."
  on public.user_stats for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own stats."
  on public.user_stats for update
  using ( auth.uid() = user_id );

-- Function to handle new user creation automatically
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  
  insert into public.user_stats (user_id, milestones)
  values (
    new.id, 
    '[{"id": 1, "title": "First Check-in", "completed": false}, {"id": 2, "title": "7-Day Streak", "completed": false}, {"id": 3, "title": "10 Sessions", "completed": false}, {"id": 4, "title": "First Activity Log", "completed": false}, {"id": 5, "title": "Explore Resources", "completed": false}]'::jsonb
  );
  return new;
end;
$$;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
