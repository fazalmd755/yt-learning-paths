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
  const goal = Number(formData.get("daily_goal_minutes"));
  const reminderEnabled = formData.get("reminder_enabled") === "on";

  if (displayName.length > 80) return { status: "error", message: "Name must be 80 characters or fewer." };
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
  if (profileError) return { status: "error", message: `Could not save your learning preferences: ${profileError.message}` };

  const { error: metadataError } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });
  if (metadataError) {
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { status: "error", message: `Learning preferences were saved, but your name could not be updated: ${metadataError.message}` };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ...idleState, status: "success", message: "Profile and learning preferences saved." };
}

export async function updatePassword(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const password = String(formData.get("new_password") ?? "");
  const confirmation = String(formData.get("confirm_password") ?? "");
  if (password.length < 6) return { status: "error", message: "Password must be at least 6 characters." };
  if (password.length > 128) return { status: "error", message: "Password must be 128 characters or fewer." };
  if (password !== confirmation) return { status: "error", message: "The passwords do not match." };

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { status: "error", message: "Sign in again to change your password." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { status: "error", message: `Could not update your password: ${error.message}` };

  revalidatePath("/settings");
  return { status: "success", message: "Your password has been updated." };
}
