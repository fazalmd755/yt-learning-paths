import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import StudyHubWorkspace from "@/components/StudyHubWorkspace";
import { getCourseSummaries } from "@/lib/data";
import { getStudyHubDetails } from "@/lib/hubs";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { title: "Study Hub Workspace — Watchlify" };

  const hub = await getStudyHubDetails(supabase, user.id, id);
  if (!hub) return { title: "Study Hub Not Found — Watchlify" };

  return {
    title: `${hub.title} — Study Hub — Watchlify`,
    description: `Track subjects and playlists for ${hub.title} on Watchlify.`,
  };
}

export default async function HubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [hub, userCourses] = await Promise.all([
    getStudyHubDetails(supabase, user.id, id),
    getCourseSummaries(supabase, user.id),
  ]);

  if (!hub) notFound();

  return (
    <main className="dashboard-shell">
      <StudyHubWorkspace hub={hub} userCourses={userCourses} />
    </main>
  );
}
