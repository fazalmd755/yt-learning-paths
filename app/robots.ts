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
  return "https://watchlify.online";
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  const publicAllowed = [
    "/",
    "/roadmaps",
    "/roadmaps/*",
    "/roadmap/*",
    "/study-hubs",
    "/study-hubs/*",
    "/syllabus",
    "/syllabus/*",
    "/planner",
    "/contact",
    "/privacy",
    "/terms",
    "/login",
    "/signup",
  ];

  const privateDisallowed = [
    "/api/*",
    "/dashboard",
    "/courses/*",
    "/watch/*",
    "/settings",
    "/auth/*",
    "/_next/*",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: publicAllowed,
        disallow: privateDisallowed,
      },
      {
        userAgent: "Googlebot",
        allow: publicAllowed,
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
