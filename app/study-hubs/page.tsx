import type { Metadata } from "next";
import { redirect } from "next/navigation";
import StudyHubsList from "@/components/StudyHubsList";
import { getStudyHubs } from "@/lib/hubs";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Study Hubs (Semester & Class Bundles) — Watchlify",
  description:
    "Group your subjects for college semesters, school classes, or competitive exams in one clean workspace. Switch between subjects with one click.",
  alternates: {
    canonical: "/study-hubs",
  },
};

export const dynamic = "force-dynamic";

export default async function StudyHubsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const hubs = await getStudyHubs(supabase, user.id);

  return (
    <main className="dashboard-shell">
      <StudyHubsList initialHubs={hubs} />
    </main>
  );
}
