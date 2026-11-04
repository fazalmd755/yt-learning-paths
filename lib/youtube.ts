const API = "https://www.googleapis.com/youtube/v3";

export type YtVideo = {
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  embeddable: boolean;
  position: number;
};

export type YtPlaylist = {
  youtubePlaylistId: string;
  title: string;
  channelTitle: string | null;
  thumbnailUrl: string | null;
  videos: YtVideo[];
};

/** URL ya seedha ID se playlist ID nikalta hai */
export function extractPlaylistId(input: string): string | null {
  const text = input.trim();
  try {
    return new URL(text).searchParams.get("list");
  } catch {
    return /^[A-Za-z0-9_-]{10,}$/.test(text) ? text : null;
  }
}

export type ParsedInput =
  | { kind: "playlist"; id: string }
  | { kind: "video"; id: string };

/** YouTube URL ya bare ID se playlist/video pehchanta hai. Playlist ko priority milti hai. */
export function parseYoutubeInput(input: string): ParsedInput | null {
  const text = (input ?? "").trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    const list = url.searchParams.get("list");
    if (list) return { kind: "playlist", id: list };
    const v = url.searchParams.get("v");
    if (v) return { kind: "video", id: v };
    if (url.hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? { kind: "video", id } : null;
    }
    const m = url.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/);
    return m ? { kind: "video", id: m[1] } : null;
  } catch {
    if (/^(PL|UU|OL|FL|LL)[A-Za-z0-9_-]{10,}$/.test(text)) return { kind: "playlist", id: text };
    if (/^[A-Za-z0-9_-]{11}$/.test(text)) return { kind: "video", id: text };
    return null;
  }
}

/** ISO 8601 duration (PT1H2M3S) -> seconds */
export function parseDuration(iso: string): number {
  const m = iso.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return 0;
  const [, d, h, min, s] = m.map((x) => Number(x ?? 0));
  return d * 86400 + h * 3600 + min * 60 + s;
}

async function yt<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY missing");
  const url = `${API}/${path}?${new URLSearchParams({ ...params, key })}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`YouTube API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function fetchPlaylist(playlistId: string): Promise<YtPlaylist> {
  // 1. Playlist ka title
  const meta = await yt<any>("playlists", { part: "snippet", id: playlistId });
  const snippet = meta.items?.[0]?.snippet;
  if (!snippet) throw new Error("Playlist not found or private");

  // 2. Saare items (50 per page)
  const items: { videoId: string; position: number }[] = [];
  let pageToken: string | undefined;
  do {
    const page = await yt<any>("playlistItems", {
      part: "snippet,contentDetails",
      playlistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
    for (const it of page.items ?? []) {
      const title: string = it.snippet?.title ?? "";
      // Private/deleted videos skip
      if (title === "Private video" || title === "Deleted video") continue;
      items.push({
        videoId: it.contentDetails.videoId,
        position: it.snippet.position,
      });
    }
    pageToken = page.nextPageToken;
  } while (pageToken);

  // 3. Duration + embeddable status (50 IDs per call)
  const videos: YtVideo[] = [];
  for (let i = 0; i < items.length; i += 50) {
    const chunk = items.slice(i, i + 50);
    const res = await yt<any>("videos", {
      part: "snippet,contentDetails,status",
      id: chunk.map((c) => c.videoId).join(","),
    });
    const byId = new Map<string, any>(res.items.map((v: any) => [v.id, v]));
    for (const c of chunk) {
      const v = byId.get(c.videoId);
      if (!v) continue; // video ab available nahi
      videos.push({
        youtubeVideoId: c.videoId,
        title: v.snippet.title,
        thumbnailUrl:
          v.snippet.thumbnails?.medium?.url ?? v.snippet.thumbnails?.default?.url ?? null,
        durationSeconds: parseDuration(v.contentDetails.duration),
        embeddable: v.status?.embeddable ?? true,
        position: c.position,
      });
    }
  }

  videos.sort((a, b) => a.position - b.position);

  return {
    youtubePlaylistId: playlistId,
    title: snippet.title,
    channelTitle: snippet.channelTitle ?? null,
    thumbnailUrl:
      snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? null,
    videos,
  };
}

/** Single video ko 1-video "course" ki tarah treat karta hai */
export async function fetchSingleVideo(videoId: string): Promise<YtPlaylist> {
  const res = await yt<any>("videos", {
    part: "snippet,contentDetails,status",
    id: videoId,
  });
  const v = res.items?.[0];
  if (!v) throw new Error("Video not found or private");
  const thumb =
    v.snippet.thumbnails?.medium?.url ?? v.snippet.thumbnails?.default?.url ?? null;
  return {
    youtubePlaylistId: `video_${videoId}`,
    title: v.snippet.title,
    channelTitle: v.snippet.channelTitle ?? null,
    thumbnailUrl: thumb,
    videos: [
      {
        youtubeVideoId: videoId,
        title: v.snippet.title,
        thumbnailUrl: thumb,
        durationSeconds: parseDuration(v.contentDetails.duration),
        embeddable: v.status?.embeddable ?? true,
        position: 0,
      },
    ],
  };
}
