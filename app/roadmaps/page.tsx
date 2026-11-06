import type { Metadata } from "next";
import { SparklesIcon } from "@/components/Icons";
import { CURATED_TRACKS } from "@/lib/roadmaps";
import RoadmapsClient from "./RoadmapsClient";

export const metadata: Metadata = {
  title: "Curated Learning Roadmaps & Playlists",
  description:
    "Explore hand-picked, high quality YouTube playlists for Web Development, Python, DSA, Machine Learning, and Design. 1-click import into your courses.",
  alternates: {
    canonical: "/roadmaps",
  },
};

export default function RoadmapsPage() {
  return (
    <main className="roadmaps-page-shell">
      <header className="roadmaps-hero">
        <div className="roadmaps-hero-badge">
          <SparklesIcon size={14} />
          <span>CURATED ROADMAPS</span>
        </div>
        <h1 className="roadmaps-hero-title">
          Hand-picked learning paths.<br />
          <span className="text-gradient-brand">Ready in one click.</span>
        </h1>
        <p className="roadmaps-hero-copy">
          No more searching for random tutorials. Pick a curated, community-approved syllabus
          and add it straight to your personal Watchlify library with progress tracking.
        </p>
      </header>

      <RoadmapsClient tracks={CURATED_TRACKS} />
    </main>
  );
}
