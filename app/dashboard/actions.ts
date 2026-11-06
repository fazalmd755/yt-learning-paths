"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const goal = Math.round(Number(formData.get("daily_goal_minutes")));
  const timezone = String(formData.get("timezone") ?? "Asia/Kolkata");
  const reminder = formData.get("reminder_enabled") === "on";

  // Galat timezone se streak/date logic toot jaata hai, isliye validate karo
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
  } catch {
    return;
  }
  if (!Number.isFinite(goal) || goal < 1 || goal > 600) return;

  await supabase
    .from("profiles")
    .update({ daily_goal_minutes: goal, timezone, reminder_enabled: reminder })
    .eq("id", user.id);

  revalidatePath("/dashboard");
}

export async function updateDailyGoal(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const goal = Math.round(Number(formData.get("daily_goal_minutes")));
  if (!Number.isFinite(goal) || goal < 1 || goal > 600) return;

  await supabase
    .from("profiles")
    .update({ daily_goal_minutes: goal })
    .eq("id", user.id);

  revalidatePath("/dashboard");
}

export async function removeCourse(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const courseId = String(formData.get("courseId") ?? "").trim();
  if (!courseId) redirect("/dashboard");

  const { error } = await supabase.from("user_courses").delete().eq("id", courseId).eq("user_id", user.id);
  if (error) {
    console.error("Failed to remove course", error);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
