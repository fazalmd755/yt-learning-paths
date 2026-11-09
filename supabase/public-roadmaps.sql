-- ====================================================================
-- Public Shareable Roadmaps & Community Curated Playlists Migration
-- Run this in your Supabase SQL editor.
-- ====================================================================

-- 1. Enable public (anonymous) read access on core YouTube metadata
-- This allows guests and unauthenticated visitors to view shared roadmaps and syllabi.
drop policy if exists "public read playlists" on public.playlists;
create policy "public read playlists" on public.playlists
  for select to anon, authenticated using (true);

drop policy if exists "public read videos" on public.videos;
create policy "public read videos" on public.videos
  for select to anon, authenticated using (true);

drop policy if exists "public read playlist_videos" on public.playlist_videos;
create policy "public read playlist_videos" on public.playlist_videos
  for select to anon, authenticated using (true);

-- 2. Add public sharing attributes to user learning paths
alter table public.user_learning_paths 
  add column if not exists is_public boolean not null default true,
  add column if not exists share_slug text unique,
  add column if not exists cloned_from_id uuid references public.user_learning_paths(id) on delete set null;

create index if not exists idx_user_learning_paths_public on public.user_learning_paths(is_public);
create index if not exists idx_user_learning_paths_slug on public.user_learning_paths(share_slug);

-- RLS policies for publicly shared custom learning paths
drop policy if exists "public read shared learning paths" on public.user_learning_paths;
create policy "public read shared learning paths" on public.user_learning_paths
  for select to anon, authenticated
  using (is_public = true or user_id = auth.uid());

drop policy if exists "public read shared learning path videos" on public.user_learning_path_videos;
create policy "public read shared learning path videos" on public.user_learning_path_videos
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.user_learning_paths
      where id = path_id and (is_public = true or user_id = auth.uid())
    )
  );

-- 3. Add public sharing attributes to user courses
alter table public.user_courses
  add column if not exists is_public boolean not null default true,
  add column if not exists share_slug text;

create index if not exists idx_user_courses_public on public.user_courses(is_public);

drop policy if exists "public read shared courses" on public.user_courses;
create policy "public read shared courses" on public.user_courses
  for select to anon, authenticated
  using (is_public = true or user_id = auth.uid());

-- 4. Helper function: 1-click clone roadmap/playlist into user courses
create or replace function public.clone_roadmap_to_user(
  p_playlist_id uuid,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
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
