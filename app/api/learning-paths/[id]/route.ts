import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body) || (!("title" in body) && !("videoIds" in body))) {
    return NextResponse.json({ error: "Provide a path name or video order to update." }, { status: 400 });
  }
  if ("title" in body && typeof body.title !== "string") {
    return NextResponse.json({ error: "Path name must be text." }, { status: 400 });
  }
  const title = body && typeof body === "object" && "title" in body && typeof body.title === "string"
    ? body.title.trim()
    : null;
  if (title !== null && (!title || title.length > 120)) {
    return NextResponse.json({ error: "Path name must be between 1 and 120 characters." }, { status: 400 });
  }

  const { data: path, error: ownerError } = await supabase.from("user_learning_paths")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (ownerError) return NextResponse.json({ error: ownerError.message }, { status: 500 });
  if (!path) return NextResponse.json({ error: "Learning path not found." }, { status: 404 });

  if (title !== null) {
    const { error } = await supabase.from("user_learning_paths")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: `Could not rename path: ${error.message}` }, { status: 500 });
  }

  if (body && typeof body === "object" && "videoIds" in body) {
    const videoIds = body.videoIds;
    if (!Array.isArray(videoIds) || videoIds.length > 200 || videoIds.some((videoId) => typeof videoId !== "string") || new Set(videoIds).size !== videoIds.length) {
      return NextResponse.json({ error: "Invalid video order." }, { status: 400 });
    }

    const { data: current, error: linksError } = await supabase.from("user_learning_path_videos")
      .select("video_id")
      .eq("path_id", id)
      .order("position", { ascending: true });
    if (linksError) return NextResponse.json({ error: linksError.message }, { status: 500 });
    const currentIds = (current ?? []).map((row) => row.video_id);
    if (currentIds.length !== videoIds.length || currentIds.some((videoId) => !videoIds.includes(videoId))) {
      return NextResponse.json({ error: "The path changed. Refresh and try reordering again." }, { status: 409 });
    }

    for (let index = 0; index < videoIds.length; index += 1) {
      const { error } = await supabase.from("user_learning_path_videos")
        .update({ position: index })
        .eq("path_id", id)
        .eq("video_id", videoIds[index]);
      if (error) return NextResponse.json({ error: `Could not reorder videos: ${error.message}`, changed: true }, { status: 500 });
    }
    const { error: updateError } = await supabase.from("user_learning_paths")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    if (updateError) return NextResponse.json({ error: updateError.message, changed: true }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const { data: path, error: pathError } = await supabase.from("user_learning_paths")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (pathError) return NextResponse.json({ error: pathError.message }, { status: 500 });
  if (!path) return NextResponse.json({ error: "Learning path not found." }, { status: 404 });

  const { error } = await supabase.from("user_learning_paths").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: `Could not delete learning path: ${error.message}` }, { status: 500 });
  return NextResponse.json({ ok: true });
}
