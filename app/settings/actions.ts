"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const idleState: SettingsActionState = { status: "idle", message: "" };

export async function saveProfileSettings(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { status: "error", message: "Sign in again to update your profile." };

  const displayName = String(formData.get("display_name") ?? "").trim();
  const learningFocus = String(formData.get("learning_focus") ?? "").trim();
  const collegeOrCompany = String(formData.get("college_or_company") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const goal = Number(formData.get("daily_goal_minutes"));
  const reminderEnabled = formData.get("reminder_enabled") === "on";

  if (displayName.length > 80) return { status: "error", message: "Name must be 80 characters or fewer." };
  if (learningFocus.length > 120) return { status: "error", message: "Learning focus must be 120 characters or fewer." };
  if (collegeOrCompany.length > 100) return { status: "error", message: "College or company must be 100 characters or fewer." };
  if (bio.length > 300) return { status: "error", message: "Bio must be 300 characters or fewer." };
  if (!Number.isInteger(goal) || goal < 1 || goal > 600) {
    return { status: "error", message: "Daily goal must be between 1 and 600 minutes." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      daily_goal_minutes: goal,
      reminder_enabled: reminderEnabled,
    })
    .eq("id", user.id);
  if (profileError) return { status: "error", message: `Could not save your preferences: ${profileError.message}` };

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      display_name: displayName,
      full_name: displayName,
      learning_focus: learningFocus,
      college_or_company: collegeOrCompany,
      bio,
    },
  });

  if (metadataError) {
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { status: "error", message: `Preferences saved, but profile info could not be updated: ${metadataError.message}` };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ...idleState, status: "success", message: "Profile updated successfully! Progress recalculated." };
}

export async function updatePassword(
  _previousState: SettingsActionState,
  _formData: FormData,
): Promise<SettingsActionState> {
  return {
    status: "error",
    message: "Watchlify uses secure Google Sign-In. Password management is handled directly through your Google account.",
  };
}
