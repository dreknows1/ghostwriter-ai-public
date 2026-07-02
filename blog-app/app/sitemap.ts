import type { MetadataRoute } from "next";
import { publicClient, refs } from "@/lib/convex";

const SITE_URL = process.env.SITE_URL || "https://blog.songghost.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let entries: { slug: string; publishedAt?: number; updatedAt?: number }[] = [];
  try {
    const client = publicClient();
    entries = await client.query(refs.getAllPublishedSlugs, {});
  } catch {}

  const items: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  ];
  for (const e of entries) {
    items.push({
      url: `${SITE_URL}/${e.slug}`,
      lastModified: new Date(e.updatedAt || e.publishedAt || Date.now()),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }
  return items;
}
