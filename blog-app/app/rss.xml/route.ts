import { publicClient, refs, BlogPost } from "@/lib/convex";

export const revalidate = 600;

const SITE_URL = process.env.SITE_URL || "https://blog.songghost.com";
const SITE_NAME = "Song Ghost — The Pit";
const SITE_DESC = "Songwriting craft, AI music tools, and the stories behind the songs.";

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  let posts: BlogPost[] = [];
  try {
    const client = publicClient();
    posts = await client.query(refs.listPublished, { limit: 50 });
  } catch {}

  const items = posts
    .map((p) => {
      const link = `${SITE_URL}/${p.slug}`;
      return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(p.publishedAt || p.createdAt).toUTCString()}</pubDate>
      <description>${escapeXml(p.description)}</description>
      ${p.author?.name ? `<author>${escapeXml(p.author.email)} (${escapeXml(p.author.name)})</author>` : ""}
      ${p.headerImageUrl ? `<enclosure url="${escapeXml(p.headerImageUrl)}" type="image/jpeg" />` : ""}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" },
  });
}
