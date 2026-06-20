import type { APIRoute } from "astro";
import { db } from "../db/client";
import { courses } from "../db/schema";

export const prerender = false;

/**
 * Format an ISO date string to YYYY-MM-DD for sitemap <lastmod>.
 * Returns null if the date is missing or invalid (lastmod omitted).
 */
function formatLastmod(isoString: string | null | undefined): string | null {
  if (!isoString) return null;
  try {
    return isoString.slice(0, 10); // "2026-06-20T..." → "2026-06-20"
  } catch {
    return null;
  }
}

export const GET: APIRoute = async ({ site }) => {
  const allCourses = db.select().from(courses).all();

  const baseUrl = (site?.origin ?? "https://pomhub.site").replace(/\/$/, "");

  const staticPages = [
    { loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${baseUrl}/categories`, priority: "0.8", changefreq: "weekly" },
    { loc: `${baseUrl}/channels`, priority: "0.8", changefreq: "weekly" },
    { loc: `${baseUrl}/community`, priority: "0.5", changefreq: "monthly" },
  ];

  const staticUrls = staticPages
    .map(
      (p) => `  <url>
    <loc>${p.loc}</loc>
    <priority>${p.priority}</priority>
    <changefreq>${p.changefreq}</changefreq>
  </url>`
    )
    .join("\n");

  const courseUrls = allCourses
    .map((c) => {
      const lastmod = formatLastmod(c.createdAt);
      return `  <url>
    <loc>${baseUrl}/video/${c.youtubeId}</loc>
    <priority>0.9</priority>
    <changefreq>weekly</changefreq>${
      lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""
    }
  </url>`;
    })
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${courseUrls}
</urlset>`;

  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
};
