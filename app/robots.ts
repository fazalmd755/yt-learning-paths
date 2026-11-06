import type { MetadataRoute } from "next";

function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://watchify.app";
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/syllabus", "/syllabus/*", "/planner", "/login", "/signup"],
        disallow: [
          "/api/*",
          "/dashboard",
          "/courses/*",
          "/watch/*",
          "/settings",
          "/auth/*",
          "/_next/*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/syllabus", "/syllabus/*", "/planner", "/login", "/signup"],
        disallow: [
          "/api/*",
          "/dashboard",
          "/courses/*",
          "/watch/*",
          "/settings",
          "/auth/*",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
