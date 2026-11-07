import { createAdminClient } from "@/lib/supabase/server";
import {
  fetchPlaylist,
  fetchSingleVideo,
  parseYoutubeInput,
  type YtPlaylist,
  type YtVideo,
} from "./youtube";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type CachedPlaylistResult = {
  id: string; // Database UUID
  youtubePlaylistId: string;
  title: string;
  channelTitle: string | null;
  thumbnailUrl: string | null;
  lastSyncedAt: string;
  isCached: boolean;
  videos: Array<{
    id: string; // Database UUID
    youtubeVideoId: string;
    title: string;
    thumbnailUrl: string | null;
    durationSeconds: number;
    embeddable: boolean;
    position: number;
  }>;
};

/**
 * YouTube Data API Quota Saver:
 * 1. Pehle database cache check karta hai.
 * 2. Agar playlist exist karti hai aur 24 ghante ke andar sync hui hai, toh 0 YouTube API calls hoti hain.
 * 3. Cache missing ya stale hone par hi YouTube API call karta hai aur DB me cache karta hai.
 */
export async function getOrFetchPlaylistWithCache(
  input: string,
  options?: { forceRefresh?: boolean }
): Promise<CachedPlaylistResult> {
  const parsed = parseYoutubeInput(input);
  if (!parsed) {
    throw new Error("Invalid YouTube playlist or video link.");
  }

  const key = parsed.kind === "playlist" ? parsed.id : `video_${parsed.id}`;
  const admin = createAdminClient();

  // 1. Check existing playlist in DB cache
  const { data: existingPl } = await admin
    .from("playlists")
    .select("id, youtube_playlist_id, title, channel_title, thumbnail_url, last_synced_at")
    .eq("youtube_playlist_id", key)
    .maybeSingle();

  if (existingPl) {
    const isStale =
      options?.forceRefresh ||
      Date.now() - new Date(existingPl.last_synced_at).getTime() > CACHE_TTL_MS;

    // Check if we already have videos cached
    const { data: cachedVideos } = await admin
      .from("playlist_videos")
      .select("position, video:videos(id, youtube_video_id, title, thumbnail_url, duration_seconds, embeddable)")
      .eq("playlist_id", existingPl.id)
      .order("position", { ascending: true })
      .limit(1000);

    const hasVideos = cachedVideos && cachedVideos.length > 0;

    // Agar fresh hai aur videos hain, toh direct cached response do (ZERO quota burned!)
    if (!isStale && hasVideos) {
      const formattedVideos = cachedVideos.map((item: any) => {
        const v = Array.isArray(item.video) ? item.video[0] : item.video;
        return {
          id: v.id,
          youtubeVideoId: v.youtube_video_id,
          title: v.title,
          thumbnailUrl: v.thumbnail_url,
          durationSeconds: v.duration_seconds ?? 0,
          embeddable: v.embeddable !== false,
          position: item.position,
        };
      });

      return {
        id: existingPl.id,
        youtubePlaylistId: existingPl.youtube_playlist_id,
        title: existingPl.title,
        channelTitle: existingPl.channel_title,
        thumbnailUrl: existingPl.thumbnail_url,
        lastSyncedAt: existingPl.last_synced_at,
        isCached: true,
        videos: formattedVideos,
      };
    }
  }

  // 2. Fetch from YouTube API v3
  let ytData: YtPlaylist;
  try {
    ytData =
      parsed.kind === "playlist"
        ? await fetchPlaylist(parsed.id)
        : await fetchSingleVideo(parsed.id);
  } catch (err: any) {
    // Agar YouTube API fail hui (e.g. quota limit ya network), aur humare paas DB me cached version hai, fallback karo
    if (existingPl) {
      const { data: cachedVideos } = await admin
        .from("playlist_videos")
        .select("position, video:videos(id, youtube_video_id, title, thumbnail_url, duration_seconds, embeddable)")
        .eq("playlist_id", existingPl.id)
        .order("position", { ascending: true });

      if (cachedVideos && cachedVideos.length > 0) {
        return {
          id: existingPl.id,
          youtubePlaylistId: existingPl.youtube_playlist_id,
          title: existingPl.title,
          channelTitle: existingPl.channel_title,
          thumbnailUrl: existingPl.thumbnail_url,
          lastSyncedAt: existingPl.last_synced_at,
          isCached: true,
          videos: cachedVideos.map((item: any) => {
            const v = Array.isArray(item.video) ? item.video[0] : item.video;
            return {
              id: v.id,
              youtubeVideoId: v.youtube_video_id,
              title: v.title,
              thumbnailUrl: v.thumbnail_url,
              durationSeconds: v.duration_seconds ?? 0,
              embeddable: v.embeddable !== false,
              position: item.position,
            };
          }),
        };
      }
    }
    throw err;
  }

  if (ytData.videos.length === 0) {
    throw new Error("No accessible videos found in this playlist.");
  }

  // 3. Save / Upsert into DB cache (Service role)
  const { data: plRow, error: plErr } = await admin
    .from("playlists")
    .upsert(
      {
        youtube_playlist_id: key,
        title: ytData.title,
        channel_title: ytData.channelTitle,
        thumbnail_url: ytData.thumbnailUrl,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "youtube_playlist_id" }
    )
    .select("id")
    .single();

  if (plErr || !plRow) {
    throw new Error(plErr?.message ?? "Could not save playlist to cache.");
  }

  // Remove duplicate videos
  const seen = new Set<string>();
  const uniqueVideos = ytData.videos.filter((v) => {
    if (seen.has(v.youtubeVideoId)) return false;
    seen.add(v.youtubeVideoId);
    return true;
  });

  const idByYtId = new Map<string, string>();
  for (let i = 0; i < uniqueVideos.length; i += 500) {
    const chunk = uniqueVideos.slice(i, i + 500).map((v) => ({
      youtube_video_id: v.youtubeVideoId,
      title: v.title,
      thumbnail_url: v.thumbnailUrl,
      duration_seconds: v.durationSeconds,
      embeddable: v.embeddable,
    }));

    const { data: vRows, error: vErr } = await admin
      .from("videos")
      .upsert(chunk, { onConflict: "youtube_video_id" })
      .select("id, youtube_video_id");

    if (vErr) throw new Error(vErr.message);
    for (const r of vRows ?? []) {
      idByYtId.set(r.youtube_video_id, r.id);
    }
  }

  // Sync relations
  await admin.from("playlist_videos").delete().eq("playlist_id", plRow.id);

  const relations = uniqueVideos
    .map((v, index) => ({
      playlist_id: plRow.id,
      video_id: idByYtId.get(v.youtubeVideoId),
      position: index,
    }))
    .filter((r) => r.video_id);

  for (let i = 0; i < relations.length; i += 500) {
    await admin.from("playlist_videos").insert(relations.slice(i, i + 500));
  }

  return {
    id: plRow.id,
    youtubePlaylistId: key,
    title: ytData.title,
    channelTitle: ytData.channelTitle,
    thumbnailUrl: ytData.thumbnailUrl,
    lastSyncedAt: new Date().toISOString(),
    isCached: false,
    videos: uniqueVideos.map((v, index) => ({
      id: idByYtId.get(v.youtubeVideoId) || v.youtubeVideoId,
      youtubeVideoId: v.youtubeVideoId,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      durationSeconds: v.durationSeconds,
      embeddable: v.embeddable,
      position: index,
    })),
  };
}
