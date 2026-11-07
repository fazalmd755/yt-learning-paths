import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseYoutubeInput } from "@/lib/youtube";
import { getOrFetchPlaylistWithCache } from "@/lib/youtube-cache";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const refresh = Boolean(body?.refresh);
  const inputUrl = String(body?.url ?? "").trim();
  const parsed = parseYoutubeInput(inputUrl);

  if (!parsed) {
    return NextResponse.json(
      { error: "This does not look like a valid YouTube playlist or video link." },
      { status: 400 }
    );
  }

  try {
    // Quota-optimized DB cache check + YouTube fetch
    const playlistData = await getOrFetchPlaylistWithCache(inputUrl, {
      forceRefresh: refresh,
    });

    if (!playlistData.id) {
      throw new Error("Failed to process playlist.");
    }

    // Link playlist to user courses
    const { error: insErr } = await supabase
      .from("user_courses")
      .upsert(
        { user_id: user.id, playlist_id: playlistData.id },
        { onConflict: "user_id,playlist_id", ignoreDuplicates: true }
      );
    if (insErr) throw new Error(insErr.message);

    const { data: course, error: getErr } = await supabase
      .from("user_courses")
      .select("id")
      .eq("user_id", user.id)
      .eq("playlist_id", playlistData.id)
      .single();

    if (getErr || !course) throw new Error(getErr?.message ?? "Could not create course.");

    return NextResponse.json({
      id: course.id,
      courseId: course.id,
      isCached: playlistData.isCached,
    });
  } catch (e: any) {
    const msg: string = e?.message ?? "Import failed.";
    const friendly = /not found or private/i.test(msg)
      ? "Playlist or video not found. Make sure it is not private."
      : /YOUTUBE_API_KEY/.test(msg)
      ? "YOUTUBE_API_KEY is not configured on the server."
      : msg;
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
