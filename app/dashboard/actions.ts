"use server";

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
