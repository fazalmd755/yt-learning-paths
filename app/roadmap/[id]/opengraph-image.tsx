import { ImageResponse } from "next/og";
import { getTrackByIdOrSlug } from "@/lib/roadmaps";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const alt = "Watchlify Public Roadmap";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let title = "Curated Learning Roadmap";
  let creator = "Watchlify Community";
  let lessonCount = 50;
  let duration = "24h";

  const curated = getTrackByIdOrSlug(id);
  if (curated) {
    title = curated.title;
    creator = curated.creator;
    lessonCount = curated.lessonCount;
    duration = curated.estimatedHours;
  } else {
    try {
      const admin = createAdminClient();
      const { data: pl } = await admin
        .from("playlists")
        .select("title, channel_title, id")
        .or(`youtube_playlist_id.eq.${id},id.eq.${id}`)
        .maybeSingle();

      if (pl) {
        title = pl.title;
        creator = pl.channel_title || "YouTube";
        const { count } = await admin
          .from("playlist_videos")
          .select("video_id", { count: "exact", head: true })
          .eq("playlist_id", pl.id);
        if (count) lessonCount = count;
      }
    } catch {
      // fallback to defaults
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0B0D11",
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(16, 185, 129, 0.15), transparent 45%), radial-gradient(circle at 85% 80%, rgba(34, 211, 238, 0.12), transparent 45%)",
          color: "white",
          padding: "60px 70px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10B981, #22D3EE)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: "900",
                color: "#0B0D11",
              }}
            >
              W
            </div>
            <span
              style={{
                fontSize: "26px",
                fontWeight: "800",
                letterSpacing: "-0.5px",
                color: "#F3F4F6",
              }}
            >
              Watchlify
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              borderRadius: "999px",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              color: "#34D399",
              fontSize: "14px",
              fontWeight: "700",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#10B981",
              }}
            />
            Public Roadmap
          </div>
        </div>

        {/* Center Title & Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "980px" }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#9CA3AF",
              letterSpacing: "0.5px",
            }}
          >
            CURATED SYLLABUS BY {creator.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: "52px",
              fontWeight: "800",
              lineHeight: 1.15,
              letterSpacing: "-1.5px",
              color: "#FFFFFF",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "#D1D5DB",
              lineHeight: 1.4,
            }}
          >
            Distraction-free learning workspace · Timestamped notes · Daily streaks · Auto-resume
          </div>
        </div>

        {/* Bottom Metrics Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            paddingTop: "32px",
          }}
        >
          <div style={{ display: "flex", gap: "36px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "28px", fontWeight: "800", color: "#10B981" }}>
                {lessonCount}
              </span>
              <span style={{ fontSize: "13px", color: "#9CA3AF", fontWeight: "600" }}>
                TOTAL LESSONS
              </span>
            </div>
            <div style={{ width: "1px", height: "36px", backgroundColor: "rgba(255,255,255,0.1)" }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "28px", fontWeight: "800", color: "#22D3EE" }}>
                {duration}
              </span>
              <span style={{ fontSize: "13px", color: "#9CA3AF", fontWeight: "600" }}>
                ESTIMATED TIME
              </span>
            </div>
            <div style={{ width: "1px", height: "36px", backgroundColor: "rgba(255,255,255,0.1)" }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "28px", fontWeight: "800", color: "#FBBF24" }}>
                100% Free
              </span>
              <span style={{ fontSize: "13px", color: "#9CA3AF", fontWeight: "600" }}>
                ZERO ADS OR SHORTS
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              backgroundColor: "#10B981",
              borderRadius: "12px",
              color: "#000000",
              fontSize: "16px",
              fontWeight: "700",
            }}
          >
            Clone & Track on Watchlify →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
