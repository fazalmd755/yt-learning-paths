-- ==============================================================================
-- Watchlify Production Security Hardening & Row Level Security (RLS) Migration
-- Target: Supabase (PostgreSQL 15+)
-- Run this script in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Ensure RLS is strictly ENABLED across EVERY table
alter table if exists public.profiles enable row level security;
alter table if exists public.playlists enable row level security;
alter table if exists public.videos enable row level security;
alter table if exists public.playlist_videos enable row level security;
alter table if exists public.user_courses enable row level security;
alter table if exists public.video_progress enable row level security;
alter table if exists public.daily_activity enable row level security;
alter table if exists public.study_tasks enable row level security;
alter table if exists public.video_notes enable row level security;
alter table if exists public.syllabus_topic_progress enable row level security;
alter table if exists public.user_exams enable row level security;
alter table if exists public.user_learning_paths enable row level security;
alter table if exists public.user_learning_path_videos enable row level security;
alter table if exists public.user_study_hubs enable row level security;
alter table if exists public.study_hub_subjects enable row level security;

-- Force RLS even for table owners (except superuser / service_role)
alter table if exists public.profiles force row level security;
alter table if exists public.user_courses force row level security;
alter table if exists public.video_progress force row level security;
alter table if exists public.daily_activity force row level security;
alter table if exists public.study_tasks force row level security;
alter table if exists public.video_notes force row level security;
alter table if exists public.syllabus_topic_progress force row level security;
alter table if exists public.user_exams force row level security;
alter table if exists public.user_learning_paths force row level security;
alter table if exists public.user_learning_path_videos force row level security;
alter table if exists public.user_study_hubs force row level security;
alter table if exists public.study_hub_subjects force row level security;

-- ==============================================================================
-- 2. Drop all legacy / ambiguous policies to ensure a clean slate
-- ==============================================================================
drop policy if exists "own profile" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

drop policy if exists "read playlists" on public.playlists;
drop policy if exists "public read playlists" on public.playlists;
drop policy if exists "playlists_public_select" on public.playlists;

drop policy if exists "read videos" on public.videos;
drop policy if exists "public read videos" on public.videos;
drop policy if exists "videos_public_select" on public.videos;

drop policy if exists "read playlist_videos" on public.playlist_videos;
drop policy if exists "public read playlist_videos" on public.playlist_videos;
drop policy if exists "playlist_videos_public_select" on public.playlist_videos;

drop policy if exists "own courses" on public.user_courses;
drop policy if exists "public read shared courses" on public.user_courses;
drop policy if exists "user_courses_select" on public.user_courses;
drop policy if exists "user_courses_insert" on public.user_courses;
drop policy if exists "user_courses_update" on public.user_courses;
drop policy if exists "user_courses_delete" on public.user_courses;

drop policy if exists "own progress" on public.video_progress;
drop policy if exists "video_progress_select" on public.video_progress;
drop policy if exists "video_progress_insert" on public.video_progress;
drop policy if exists "video_progress_update" on public.video_progress;
drop policy if exists "video_progress_delete" on public.video_progress;

drop policy if exists "own activity" on public.daily_activity;
drop policy if exists "daily_activity_select" on public.daily_activity;
drop policy if exists "daily_activity_insert" on public.daily_activity;
drop policy if exists "daily_activity_update" on public.daily_activity;
drop policy if exists "daily_activity_delete" on public.daily_activity;

drop policy if exists "own study tasks" on public.study_tasks;
drop policy if exists "study_tasks_select" on public.study_tasks;
drop policy if exists "study_tasks_insert" on public.study_tasks;
drop policy if exists "study_tasks_update" on public.study_tasks;
drop policy if exists "study_tasks_delete" on public.study_tasks;

drop policy if exists "own video notes" on public.video_notes;
drop policy if exists "video_notes_select" on public.video_notes;
drop policy if exists "video_notes_insert" on public.video_notes;
drop policy if exists "video_notes_update" on public.video_notes;
drop policy if exists "video_notes_delete" on public.video_notes;

drop policy if exists "own syllabus progress" on public.syllabus_topic_progress;
drop policy if exists "syllabus_progress_select" on public.syllabus_topic_progress;
drop policy if exists "syllabus_progress_insert" on public.syllabus_topic_progress;
drop policy if exists "syllabus_progress_update" on public.syllabus_topic_progress;
drop policy if exists "syllabus_progress_delete" on public.syllabus_topic_progress;

drop policy if exists "own exam dates" on public.user_exams;
drop policy if exists "user_exams_select" on public.user_exams;
drop policy if exists "user_exams_insert" on public.user_exams;
drop policy if exists "user_exams_update" on public.user_exams;
drop policy if exists "user_exams_delete" on public.user_exams;

drop policy if exists "own learning paths" on public.user_learning_paths;
drop policy if exists "public read shared learning paths" on public.user_learning_paths;
drop policy if exists "user_learning_paths_select" on public.user_learning_paths;
drop policy if exists "user_learning_paths_insert" on public.user_learning_paths;
drop policy if exists "user_learning_paths_update" on public.user_learning_paths;
drop policy if exists "user_learning_paths_delete" on public.user_learning_paths;

drop policy if exists "own learning path videos" on public.user_learning_path_videos;
drop policy if exists "public read shared learning path videos" on public.user_learning_path_videos;
drop policy if exists "user_learning_path_videos_select" on public.user_learning_path_videos;
drop policy if exists "user_learning_path_videos_insert" on public.user_learning_path_videos;
drop policy if exists "user_learning_path_videos_update" on public.user_learning_path_videos;
drop policy if exists "user_learning_path_videos_delete" on public.user_learning_path_videos;

drop policy if exists "own study hubs" on public.user_study_hubs;
drop policy if exists "public read study hubs" on public.user_study_hubs;
drop policy if exists "manage own study hubs" on public.user_study_hubs;
drop policy if exists "user_study_hubs_select" on public.user_study_hubs;
drop policy if exists "user_study_hubs_insert" on public.user_study_hubs;
drop policy if exists "user_study_hubs_update" on public.user_study_hubs;
drop policy if exists "user_study_hubs_delete" on public.user_study_hubs;

drop policy if exists "own study hub subjects" on public.study_hub_subjects;
drop policy if exists "public read study hub subjects" on public.study_hub_subjects;
drop policy if exists "manage own study hub subjects" on public.study_hub_subjects;
drop policy if exists "study_hub_subjects_select" on public.study_hub_subjects;
drop policy if exists "study_hub_subjects_insert" on public.study_hub_subjects;
drop policy if exists "study_hub_subjects_update" on public.study_hub_subjects;
drop policy if exists "study_hub_subjects_delete" on public.study_hub_subjects;

-- ==============================================================================
-- 3. SHARED YOUTUBE METADATA (Public Read-Only, Writes restricted to Service Role)
-- ==============================================================================
create policy "playlists_public_select" on public.playlists
  for select to anon, authenticated using (true);

create policy "videos_public_select" on public.videos
  for select to anon, authenticated using (true);

create policy "playlist_videos_public_select" on public.playlist_videos
  for select to anon, authenticated using (true);

-- ==============================================================================
-- 4. USER PROFILES (Strictly Private per User)
-- ==============================================================================
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (id = auth.uid());

-- ==============================================================================
-- 5. USER COURSES (Personal Enrollments)
-- ==============================================================================
create policy "user_courses_select" on public.user_courses
  for select to anon, authenticated
  using (is_public = true or user_id = auth.uid());

create policy "user_courses_insert" on public.user_courses
  for insert to authenticated with check (user_id = auth.uid());

create policy "user_courses_update" on public.user_courses
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "user_courses_delete" on public.user_courses
  for delete to authenticated using (user_id = auth.uid());

-- ==============================================================================
-- 6. VIDEO PROGRESS & STUDY STREAKS (Strictly Private)
-- ==============================================================================
create policy "video_progress_select" on public.video_progress
  for select to authenticated using (user_id = auth.uid());

create policy "video_progress_insert" on public.video_progress
  for insert to authenticated with check (user_id = auth.uid());

create policy "video_progress_update" on public.video_progress
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "video_progress_delete" on public.video_progress
  for delete to authenticated using (user_id = auth.uid());

create policy "daily_activity_select" on public.daily_activity
  for select to authenticated using (user_id = auth.uid());

create policy "daily_activity_insert" on public.daily_activity
  for insert to authenticated with check (user_id = auth.uid());

create policy "daily_activity_update" on public.daily_activity
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "daily_activity_delete" on public.daily_activity
  for delete to authenticated using (user_id = auth.uid());

-- ==============================================================================
-- 7. STUDY TASKS & TIMESTAMPTED NOTES (Strictly Private)
-- ==============================================================================
create policy "study_tasks_select" on public.study_tasks
  for select to authenticated using (user_id = auth.uid());

create policy "study_tasks_insert" on public.study_tasks
  for insert to authenticated with check (user_id = auth.uid());

create policy "study_tasks_update" on public.study_tasks
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "study_tasks_delete" on public.study_tasks
  for delete to authenticated using (user_id = auth.uid());

create policy "video_notes_select" on public.video_notes
  for select to authenticated using (user_id = auth.uid());

create policy "video_notes_insert" on public.video_notes
  for insert to authenticated with check (user_id = auth.uid());

create policy "video_notes_update" on public.video_notes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "video_notes_delete" on public.video_notes
  for delete to authenticated using (user_id = auth.uid());

-- ==============================================================================
-- 8. SYLLABUS TOPIC PROGRESS & USER EXAMS (Strictly Private)
-- ==============================================================================
create policy "syllabus_progress_select" on public.syllabus_topic_progress
  for select to authenticated using (user_id = auth.uid());

create policy "syllabus_progress_insert" on public.syllabus_topic_progress
  for insert to authenticated with check (user_id = auth.uid());

create policy "syllabus_progress_update" on public.syllabus_topic_progress
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "syllabus_progress_delete" on public.syllabus_topic_progress
  for delete to authenticated using (user_id = auth.uid());

create policy "user_exams_select" on public.user_exams
  for select to authenticated using (user_id = auth.uid());

create policy "user_exams_insert" on public.user_exams
  for insert to authenticated with check (user_id = auth.uid());

create policy "user_exams_update" on public.user_exams
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "user_exams_delete" on public.user_exams
  for delete to authenticated using (user_id = auth.uid());

-- ==============================================================================
-- 9. USER LEARNING PATHS (Public Read if is_public = true, Owner write)
-- ==============================================================================
create policy "user_learning_paths_select" on public.user_learning_paths
  for select to anon, authenticated
  using (is_public = true or user_id = auth.uid());

create policy "user_learning_paths_insert" on public.user_learning_paths
  for insert to authenticated with check (user_id = auth.uid());

create policy "user_learning_paths_update" on public.user_learning_paths
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "user_learning_paths_delete" on public.user_learning_paths
  for delete to authenticated using (user_id = auth.uid());

-- Videos in Learning Paths: User must own the parent path to modify
create policy "user_learning_path_videos_select" on public.user_learning_path_videos
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.user_learning_paths
      where id = path_id and (is_public = true or user_id = auth.uid())
    )
  );

create policy "user_learning_path_videos_insert" on public.user_learning_path_videos
  for insert to authenticated
  with check (
    exists (
      select 1 from public.user_learning_paths
      where id = path_id and user_id = auth.uid()
    )
  );

create policy "user_learning_path_videos_update" on public.user_learning_path_videos
  for update to authenticated
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

create policy "user_learning_path_videos_delete" on public.user_learning_path_videos
  for delete to authenticated
  using (
    exists (
      select 1 from public.user_learning_paths
      where id = path_id and user_id = auth.uid()
    )
  );

-- ==============================================================================
-- 10. STUDY HUBS & SUBJECTS (Hardened against Cross-Hub Injection)
-- ==============================================================================
create policy "user_study_hubs_select" on public.user_study_hubs
  for select to anon, authenticated
  using (is_public = true or user_id = auth.uid());

create policy "user_study_hubs_insert" on public.user_study_hubs
  for insert to authenticated with check (user_id = auth.uid());

create policy "user_study_hubs_update" on public.user_study_hubs
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "user_study_hubs_delete" on public.user_study_hubs
  for delete to authenticated using (user_id = auth.uid());

-- Subjects: Must verify BOTH subject user_id AND parent hub ownership
create policy "study_hub_subjects_select" on public.study_hub_subjects
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.user_study_hubs
      where id = hub_id and (is_public = true or user_id = auth.uid())
    )
  );

create policy "study_hub_subjects_insert" on public.study_hub_subjects
  for insert to authenticated
  with check (
    user_id = auth.uid() and
    exists (
      select 1 from public.user_study_hubs
      where id = hub_id and user_id = auth.uid()
    )
  );

create policy "study_hub_subjects_update" on public.study_hub_subjects
  for update to authenticated
  using (
    user_id = auth.uid() and
    exists (
      select 1 from public.user_study_hubs
      where id = hub_id and user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid() and
    exists (
      select 1 from public.user_study_hubs
      where id = hub_id and user_id = auth.uid()
    )
  );

create policy "study_hub_subjects_delete" on public.study_hub_subjects
  for delete to authenticated
  using (
    user_id = auth.uid() and
    exists (
      select 1 from public.user_study_hubs
      where id = hub_id and user_id = auth.uid()
    )
  );

-- ==============================================================================
-- 11. SECURITY DEFINER FUNCTIONS HARDENING
-- Prevent Search-Path Hijacking
-- ==============================================================================
create or replace function public.clone_roadmap_to_user(
  p_playlist_id uuid,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
begin
  if auth.uid() is null or auth.uid() != p_user_id then
    raise exception 'Unauthorized';
  end if;

  insert into public.user_courses (user_id, playlist_id)
  values (p_user_id, p_playlist_id)
  on conflict (user_id, playlist_id) do update set created_at = now()
  returning id into v_course_id;

  return v_course_id;
end;
$$;
