import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Watchlify - Turn YouTube Playlists into Structured Courses";
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
          backgroundColor: "#08080C",
          backgroundImage:
            "radial-gradient(circle at 85% 15%, rgba(206, 244, 50, 0.18), transparent 50%), radial-gradient(circle at 15% 85%, rgba(206, 244, 50, 0.08), transparent 50%)",
          color: "#FFFFFF",
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
              background: "#08080C",
              border: "1px solid rgba(206, 244, 50, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 24px rgba(206, 244, 50, 0.35)",
            }}
          >
            <svg width="44" height="44" viewBox="0 0 512 512">
              <defs>
                <linearGradient id="og-grad" x1="80" y1="100" x2="440" y2="400" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#CEF432" />
                  <stop offset="1" stopColor="#E2FF66" />
                </linearGradient>
              </defs>
              <g transform="translate(0,14)">
                <path
                  d="M96 150 L176 366 L256 226 L336 366 L416 150"
                  fill="none"
                  stroke="url(#og-grad)"
                  strokeWidth="44"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M236 100 L236 172 L294 136 Z"
                  fill="url(#og-grad)"
                  stroke="url(#og-grad)"
                  strokeWidth="14"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          </div>
          <span style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Watch<span style={{ color: "#22D3EE" }}>lify</span>
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
