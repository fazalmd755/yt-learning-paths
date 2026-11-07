"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseYoutubeInput } from "@/lib/youtube";
import { getOrFetchPlaylistWithCache } from "@/lib/youtube-cache";

export async function createStudyHub(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first." };

  const title = String(formData.get("title") ?? "").trim();
  const hubType = String(formData.get("hub_type") ?? "semester").trim();
  const description = String(formData.get("description") ?? "").trim();
  const targetDateRaw = String(formData.get("target_date") ?? "").trim();
  const targetDate = targetDateRaw ? targetDateRaw : null;

  if (!title || title.length > 120) {
    return { error: "Please provide a valid hub title (up to 120 characters)." };
  }

  const validTypes = ["semester", "class", "exam", "custom"];
  const finalType = validTypes.includes(hubType) ? hubType : "semester";

  const { data, error } = await supabase
    .from("user_study_hubs")
    .insert({
      user_id: user.id,
      title,
      hub_type: finalType,
      description,
      target_date: targetDate,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/study-hubs");
  return { success: true, hubId: data.id };
}

export async function updateStudyHub(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first." };

  const hubId = String(formData.get("hub_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const hubType = String(formData.get("hub_type") ?? "semester").trim();
  const description = String(formData.get("description") ?? "").trim();
  const targetDateRaw = String(formData.get("target_date") ?? "").trim();
  const targetDate = targetDateRaw ? targetDateRaw : null;

  if (!hubId || !title) {
    return { error: "Hub ID and title are required." };
  }

  const validTypes = ["semester", "class", "exam", "custom"];
  const finalType = validTypes.includes(hubType) ? hubType : "semester";

  const { error } = await supabase
    .from("user_study_hubs")
    .update({
      title,
      hub_type: finalType,
      description,
      target_date: targetDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", hubId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/study-hubs");
  revalidatePath(`/study-hubs/${hubId}`);
  return { success: true };
}

export async function deleteStudyHub(hubId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first." };

  const { error } = await supabase
    .from("user_study_hubs")
    .delete()
    .eq("id", hubId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/study-hubs");
  return { success: true };
}

export async function addSubjectToHub(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first." };

  const hubId = String(formData.get("hub_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const color = String(formData.get("color") ?? "blue").trim();
  const existingCourseId = String(formData.get("course_id") ?? "").trim();
  const youtubeUrl = String(formData.get("youtube_url") ?? "").trim();

  if (!hubId || !name) {
    return { error: "Subject name is required." };
  }

  let finalCourseId: string | null = null;
  let finalPlaylistId: string | null = null;

  if (existingCourseId) {
    finalCourseId = existingCourseId;
    const { data: courseRow } = await supabase
      .from("user_courses")
      .select("playlist_id")
      .eq("id", existingCourseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (courseRow) {
      finalPlaylistId = courseRow.playlist_id;
    }
  } else if (youtubeUrl) {
    const parsed = parseYoutubeInput(youtubeUrl);
    if (!parsed) {
      return { error: "Invalid YouTube playlist or video link." };
    }

    try {
      const playlistData = await getOrFetchPlaylistWithCache(youtubeUrl);
      if (!playlistData?.id) {
        return { error: "Could not fetch YouTube playlist." };
      }
      finalPlaylistId = playlistData.id;

      // Link to user_courses so progress tracking works
      await supabase
        .from("user_courses")
        .upsert(
          { user_id: user.id, playlist_id: playlistData.id },
          { onConflict: "user_id,playlist_id", ignoreDuplicates: true }
        );

      const { data: courseRow } = await supabase
        .from("user_courses")
        .select("id")
        .eq("user_id", user.id)
        .eq("playlist_id", playlistData.id)
        .single();

      if (courseRow) {
        finalCourseId = courseRow.id;
      }
    } catch (err: any) {
      return { error: err.message || "Failed to import YouTube playlist." };
    }
  }

  // Count existing subjects in hub to set position
  const { count } = await supabase
    .from("study_hub_subjects")
    .select("id", { count: "exact", head: true })
    .eq("hub_id", hubId);

  const { error: insertError } = await supabase.from("study_hub_subjects").insert({
    hub_id: hubId,
    user_id: user.id,
    name,
    code,
    color,
    course_id: finalCourseId,
    playlist_id: finalPlaylistId,
    position: count ?? 0,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  // Also touch updated_at on the parent hub
  await supabase
    .from("user_study_hubs")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", hubId);

  revalidatePath(`/study-hubs/${hubId}`);
  revalidatePath("/study-hubs");
  return { success: true };
}

export async function removeSubjectFromHub(subjectId: string, hubId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first." };

  const { error } = await supabase
    .from("study_hub_subjects")
    .delete()
    .eq("id", subjectId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  await supabase
    .from("user_study_hubs")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", hubId);

  revalidatePath(`/study-hubs/${hubId}`);
  revalidatePath("/study-hubs");
  return { success: true };
}
