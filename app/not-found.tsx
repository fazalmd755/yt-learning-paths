import Link from "next/link";

export default function NotFound() {
  return (
    <main className="dashboard-shell" style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
      <h1 style={{ fontSize: "28px", fontWeight: "750", marginBottom: "8px" }}>Page or Course Not Found</h1>
      <p style={{ color: "#a0a5ad", marginBottom: "24px", fontSize: "14px" }}>
        The playlist, lesson, or page you were looking for doesn’t exist or has been removed.
      </p>
      <Link
        href="/dashboard"
        className="button-primary"
        style={{ display: "inline-flex", textDecoration: "none" }}
      >
        Back to Dashboard <span aria-hidden="true">→</span>
      </Link>
    </main>
  );
}
