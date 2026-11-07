import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicStudyHubView from "@/components/PublicStudyHubView";
import { getPublicStudyHub } from "@/lib/hubs";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const hub = await getPublicStudyHub(supabase, id);

  if (!hub) {
    return {
      title: "Study Hub Not Found — Watchlify",
      description: "The requested Study Hub does not exist or is private.",
    };
  }

  const categoryLabel =
    hub.hubType === "semester"
      ? "Semester Hub"
      : hub.hubType === "class"
      ? "Class Hub"
      : hub.hubType === "exam"
      ? "Exam Prep Hub"
      : "Study Hub";

  return {
    title: `${hub.title} — ${categoryLabel} on Watchlify`,
    description: `Study ${hub.totalSubjects} subjects (${hub.totalVideos} lectures) together on Watchlify. Clone this bundle to track your own study progress without distractions.`,
    openGraph: {
      title: `${hub.title} — Watchlify Study Hub`,
      description: `${hub.totalSubjects} subjects • ${hub.totalVideos} lectures in one single screen.`,
    },
  };
}

export default async function PublicStudyHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hub = await getPublicStudyHub(supabase, id, user?.id);

  if (!hub) {
    notFound();
  }

  return (
    <main className="dashboard-shell">
      <PublicStudyHubView
        hub={hub}
        currentUser={user ? { id: user.id, email: user.email } : null}
      />
    </main>
  );
}
