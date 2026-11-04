-- Apply once to an existing project to add planner, notes and syllabus tracking.
-- New projects get these tables from schema.sql.

create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  details text not null default '',
  subject text not null default '',
  task_date date not null,
  start_time time,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists study_tasks_user_date_idx on public.study_tasks (user_id, task_date, start_time);

create table if not exists public.video_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  timestamp_seconds int not null default 0 check (timestamp_seconds >= 0),
  content text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists video_notes_user_video_idx on public.video_notes (user_id, video_id, timestamp_seconds);

create table if not exists public.syllabus_topic_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_slug text not null,
  topic_key text not null,
  subject text not null,
  title text not null,
  is_completed boolean not null default false,
  is_bookmarked boolean not null default false,
  is_weak boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, exam_slug, topic_key)
);

create table if not exists public.user_exams (
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_slug text not null,
  exam_name text,
  exam_date date,
  updated_at timestamptz not null default now(),
  primary key (user_id, exam_slug)
);
alter table public.user_exams add column if not exists exam_name text;

create table if not exists public.user_learning_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_learning_paths_user_updated_idx on public.user_learning_paths (user_id, updated_at desc);

create table if not exists public.user_learning_path_videos (
  path_id uuid not null references public.user_learning_paths(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  position int not null check (position >= 0),
  created_at timestamptz not null default now(),
  primary key (path_id, video_id)
);
create index if not exists user_learning_path_videos_path_position_idx on public.user_learning_path_videos (path_id, position);

alter table public.study_tasks enable row level security;
alter table public.video_notes enable row level security;
alter table public.syllabus_topic_progress enable row level security;
alter table public.user_exams enable row level security;
alter table public.user_learning_paths enable row level security;
alter table public.user_learning_path_videos enable row level security;

drop policy if exists "own study tasks" on public.study_tasks;
create policy "own study tasks" on public.study_tasks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own video notes" on public.video_notes;
create policy "own video notes" on public.video_notes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own syllabus progress" on public.syllabus_topic_progress;
create policy "own syllabus progress" on public.syllabus_topic_progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own exam dates" on public.user_exams;
create policy "own exam dates" on public.user_exams
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own learning paths" on public.user_learning_paths;
create policy "own learning paths" on public.user_learning_paths
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own learning path videos" on public.user_learning_path_videos;
create policy "own learning path videos" on public.user_learning_path_videos
  for all to authenticated
  using (
    exists (
      select 1 from public.user_learning_paths
      where id = path_id and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.user_learning_paths
      where id = path_id and user_id = auth.uid()
    )
  );
