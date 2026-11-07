-- Study Hubs & Subject Bundles (Semesters, Classes & Exam Prep)
-- Run this script in the Supabase SQL Editor.

create table if not exists public.user_study_hubs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  hub_type text not null default 'semester' check (hub_type in ('semester', 'class', 'exam', 'custom')),
  description text not null default '',
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_study_hubs_user_idx on public.user_study_hubs (user_id, updated_at desc);

create table if not exists public.study_hub_subjects (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.user_study_hubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  code text not null default '',
  color text not null default 'blue',
  course_id uuid references public.user_courses(id) on delete set null,
  playlist_id uuid references public.playlists(id) on delete set null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists study_hub_subjects_hub_idx on public.study_hub_subjects (hub_id, position);

alter table public.user_study_hubs enable row level security;
alter table public.study_hub_subjects enable row level security;

drop policy if exists "own study hubs" on public.user_study_hubs;
create policy "own study hubs" on public.user_study_hubs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own study hub subjects" on public.study_hub_subjects;
create policy "own study hub subjects" on public.study_hub_subjects
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
