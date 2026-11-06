import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Watchify - Turn YouTube Playlists into Structured Courses";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          backgroundColor: "#0b0d11",
          backgroundImage:
            "radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.15), transparent 50%), radial-gradient(circle at 15% 85%, rgba(249, 115, 22, 0.12), transparent 50%)",
          color: "#f8fafc",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "30px",
              fontWeight: 800,
              boxShadow: "0 0 24px rgba(16, 185, 129, 0.4)",
            }}
          >
            W
          </div>
          <span style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Watchify
          </span>
          <div
            style={{
              marginLeft: "16px",
              padding: "6px 16px",
              borderRadius: "9999px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              fontSize: "14px",
              fontWeight: 600,
              color: "#94a3b8",
              letterSpacing: "0.06em",
            }}
          >
            FOCUSED STUDY WORKSPACE
          </div>
        </div>

        {/* Hero headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "980px" }}>
          <h1
            style={{
              fontSize: "62px",
              fontWeight: 850,
              lineHeight: 1.1,
              letterSpacing: "-0.035em",
              margin: 0,
              color: "#ffffff",
            }}
          >
            Turn YouTube playlists into structured learning paths.
          </h1>
          <p
            style={{
              fontSize: "26px",
              lineHeight: 1.4,
              color: "#94a3b8",
              margin: 0,
            }}
          >
            Track every lesson, build daily study streaks, and finish what you start.
          </p>
        </div>

        {/* Feature badges row */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 22px",
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#34d399",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            <span>✓</span> Progress Tracking
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 22px",
              borderRadius: "12px",
              background: "rgba(249, 115, 22, 0.12)",
              border: "1px solid rgba(249, 115, 22, 0.3)",
              color: "#fb923c",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            <span>🔥</span> Daily Streaks
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 22px",
              borderRadius: "12px",
              background: "rgba(56, 189, 248, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              color: "#38bdf8",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            <span>✦</span> Timestamped Notes
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
