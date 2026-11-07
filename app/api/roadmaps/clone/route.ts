import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrackByIdOrSlug } from "@/lib/roadmaps";
import { getOrFetchPlaylistWithCache } from "@/lib/youtube-cache";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to clone roadmap." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const roadmapId = String(body?.roadmapId ?? "").trim();
    if (!roadmapId) {
      return NextResponse.json({ error: "Missing roadmap ID." }, { status: 400 });
    }

    // 1. Check curated track
    const curated = getTrackByIdOrSlug(roadmapId);
    let playlistUrl = curated ? curated.playlistUrl : roadmapId;

    // If it's a UUID or custom learning path
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roadmapId);
    if (isUuid) {
      // Check if it's a public user_learning_path
      const { data: path } = await supabase
        .from("user_learning_paths")
        .select("id, title, description")
        .eq("id", roadmapId)
        .maybeSingle();

      if (path) {
        // Clone learning path for user
        const { data: newPath, error: newPathErr } = await supabase
          .from("user_learning_paths")
          .insert({
            user_id: user.id,
            title: `${path.title} (Cloned)`,
            description: path.description,
          })
          .select("id")
          .single();

        if (newPathErr || !newPath) throw new Error(newPathErr?.message || "Could not clone path.");

        // Copy videos
        const { data: vids } = await supabase
          .from("user_learning_path_videos")
          .select("video_id, position")
          .eq("path_id", path.id);

        if (vids && vids.length > 0) {
          await supabase.from("user_learning_path_videos").insert(
            vids.map((v) => ({
              path_id: newPath.id,
              video_id: v.video_id,
              position: v.position,
            }))
          );
        }

        return NextResponse.json({
          success: true,
          type: "learning-path",
          redirectUrl: `/learning-paths/${newPath.id}`,
        });
      }
    }

    // 2. Fetch or retrieve from cache
    const playlistData = await getOrFetchPlaylistWithCache(playlistUrl);

    // 3. Link to user courses
    const { error: insErr } = await supabase.from("user_courses").upsert(
      { user_id: user.id, playlist_id: playlistData.id },
      { onConflict: "user_id,playlist_id", ignoreDuplicates: true }
    );
    if (insErr) throw insErr;

    const { data: course, error: getErr } = await supabase
      .from("user_courses")
      .select("id")
      .eq("user_id", user.id)
      .eq("playlist_id", playlistData.id)
      .single();

    if (getErr || !course) throw getErr;

    return NextResponse.json({
      success: true,
      type: "course",
      courseId: course.id,
      redirectUrl: `/courses/${course.id}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to clone roadmap." },
      { status: 500 }
    );
  }
}
