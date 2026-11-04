-- YouTube Learning Paths: MVP schema
-- Supabase SQL Editor mein run karo.

-- ============ TABLES ============

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'Asia/Kolkata',
  daily_goal_minutes int not null default 15 check (daily_goal_minutes > 0),
  reminder_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- Shared cache: ek playlist ek baar fetch hoti hai, sabke kaam aati hai
create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  youtube_playlist_id text not null unique,
  title text not null,
  channel_title text,
  thumbnail_url text,
  last_synced_at timestamptz not null default now()
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  youtube_video_id text not null unique,
  title text not null,
  thumbnail_url text,
  duration_seconds int not null default 0,
  embeddable boolean not null default true
);

create table public.playlist_videos (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  position int not null,
  primary key (playlist_id, video_id)
);
create index on public.playlist_videos (playlist_id, position);

-- User-specific data
create table public.user_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  last_video_id uuid references public.videos(id),
  created_at timestamptz not null default now(),
  unique (user_id, playlist_id)
);

create table public.video_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  seconds_watched int not null default 0,
  last_position int not null default 0,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create table public.daily_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  seconds_learned int not null default 0,
  primary key (user_id, activity_date)
);

-- ============ PLANNER, NOTES & SYLLABUS TRACKING ============

create table public.study_tasks (
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
create index on public.study_tasks (user_id, task_date, start_time);

create table public.video_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  timestamp_seconds int not null default 0 check (timestamp_seconds >= 0),
  content text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index on public.video_notes (user_id, video_id, timestamp_seconds);

create table public.syllabus_topic_progress (
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

create table public.user_exams (
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_slug text not null,
  exam_name text,
  exam_date date,
  updated_at timestamptz not null default now(),
  primary key (user_id, exam_slug)
);

create table public.user_learning_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.user_learning_paths (user_id, updated_at desc);

create table public.user_learning_path_videos (
  path_id uuid not null references public.user_learning_paths(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  position int not null check (position >= 0),
  created_at timestamptz not null default now(),
  primary key (path_id, video_id)
);
create index on public.user_learning_path_videos (path_id, position);

-- ============ ROW LEVEL SECURITY ============

alter table public.profiles enable row level security;
alter table public.playlists enable row level security;
alter table public.videos enable row level security;
alter table public.playlist_videos enable row level security;
alter table public.user_courses enable row level security;
alter table public.video_progress enable row level security;
alter table public.daily_activity enable row level security;
alter table public.study_tasks enable row level security;
alter table public.video_notes enable row level security;
alter table public.syllabus_topic_progress enable row level security;
alter table public.user_exams enable row level security;
alter table public.user_learning_paths enable row level security;
alter table public.user_learning_path_videos enable row level security;

-- Shared cache: logged-in users sirf padh sakte hain.
-- Write sirf server (service role key) se hoga, jo RLS bypass karti hai.
create policy "read playlists" on public.playlists
  for select to authenticated using (true);
create policy "read videos" on public.videos
  for select to authenticated using (true);
create policy "read playlist_videos" on public.playlist_videos
  for select to authenticated using (true);

-- Har user sirf apna data dekh/badal sake
create policy "own profile" on public.profiles
  for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "own courses" on public.user_courses
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own progress" on public.video_progress
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own activity" on public.daily_activity
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own study tasks" on public.study_tasks
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own video notes" on public.video_notes
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own syllabus progress" on public.syllabus_topic_progress
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own exam dates" on public.user_exams
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own learning paths" on public.user_learning_paths
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

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

-- ============ SIGNUP PAR PROFILE BANAO ============

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ PROGRESS SAVE (ek hi call mein) ============
-- Player se har ~10 sec mein call karo.
-- p_seconds = sirf is interval mein ACTUAL play hua time (seek ka time nahi).
create or replace function public.save_progress(
  p_video_id uuid,
  p_position int,
  p_seconds int,
  p_duration int
)
returns void
language plpgsql
security invoker
as $$
declare
  tz text;
  today date;
  watched int;
  new_status text;
begin
  select timezone into tz from public.profiles where id = auth.uid();
  today := (now() at time zone coalesce(tz, 'Asia/Kolkata'))::date;

  -- p_seconds ko cap karo taaki koi fake bada number na bheje
  p_seconds := least(greatest(p_seconds, 0), 60);

  insert into public.video_progress as vp
    (user_id, video_id, seconds_watched, last_position, status, updated_at)
  values
    (auth.uid(), p_video_id, p_seconds, p_position, 'in_progress', now())
  on conflict (user_id, video_id) do update
    set seconds_watched = vp.seconds_watched + p_seconds,
        last_position = p_position,
        updated_at = now()
  returning vp.seconds_watched into watched;

  -- 90% rule: actual dekha hua time duration ka 90% ho to completed
  if p_duration > 0 and watched >= p_duration * 0.9 then
    update public.video_progress
       set status = 'completed',
           completed_at = coalesce(completed_at, now())
     where user_id = auth.uid() and video_id = p_video_id
       and status <> 'completed';
  end if;

  insert into public.daily_activity (user_id, activity_date, seconds_learned)
  values (auth.uid(), today, p_seconds)
  on conflict (user_id, activity_date) do update
    set seconds_learned = public.daily_activity.seconds_learned + p_seconds;
end;
$$;

-- ============ STREAK ============
-- Aaj kuch seekha hai to aaj se, warna kal se peeche count karta hai.
create or replace function public.current_streak()
returns int
language plpgsql
stable
security invoker
as $$
declare
  tz text;
  d date;
  n int := 0;
begin
  select timezone into tz from public.profiles where id = auth.uid();
  d := (now() at time zone coalesce(tz, 'Asia/Kolkata'))::date;

  if not exists (
    select 1 from public.daily_activity
    where user_id = auth.uid() and activity_date = d and seconds_learned > 0
  ) then
    d := d - 1;
  end if;

  while exists (
    select 1 from public.daily_activity
    where user_id = auth.uid() and activity_date = d and seconds_learned > 0
  ) loop
    n := n + 1;
    d := d - 1;
  end loop;

  return n;
end;
$$;
