// One-shot migration: scrape blog.songghost.com (GHL) → seed Convex blogPosts.
//
// Usage:
//   set -a; source /tmp/prod.env; set +a
//   node scripts/migrate-ghl-blog.mjs
//
// Requires CONVEX_URL + CONVEX_ADMIN_KEY (prod values from `vercel env pull`).
// Idempotent: re-running upserts by slug.

import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

const SLUGS = [
  "44-percent-ai-generated-songs-stand-out",
  "ai-vs-human-songwriting-can-you-tell-the-difference",
  "how-to-write-a-bridge-in-a-song",
  "why-sad-songs-make-us-happy",
];

const OWNER = {
  email: "andre7171973@gmail.com",
  name: "Andre Thomas",
  bio: "Founder of Song Ghost. Writes about songwriting, AI music tools, and the craft.",
  isOwner: true,
};

const upsertAuthor = makeFunctionReference("blog:upsertAuthorInternal");
const upsertPost = makeFunctionReference("blog:upsertPostInternal");

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&hellip;/g, "...")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
}

function pickMeta(html, name, attr = "name") {
  const re = new RegExp(`<meta\\s+${attr}=["']${name}["']\\s+content=["']([^"']+)["']`, "i");
  const m = html.match(re);
  return m ? decodeEntities(m[1]) : "";
}

function htmlToMarkdown(html) {
  // GHL renders blog posts SSR for crawlers but as a JS shell for browsers.
  // The article body lives inside a div with class "blog-html-container-single".
  let body = "";
  const container = html.match(/<div[^>]*class="[^"]*blog-html-container-single[^"]*"[^>]*>([\s\S]*?)<\/div>(?=\s*<(?:div class="blog-tags|footer|script))/i);
  if (container) {
    body = container[1];
    // Strip GHL chrome that lives at the start of the container:
    // 1) cover image
    body = body.replace(/<div[^>]*class="[^"]*blog-cover-image-container[^"]*"[^>]*>[\s\S]*?<\/div>/i, "");
    // 2) the h1 title (we already store it separately)
    body = body.replace(/<h1[^>]*class="[^"]*header-title[^"]*"[^>]*>[\s\S]*?<\/h1>/i, "");
    // 3) meta sections (author / date / category)
    body = body.replace(/<div[^>]*class="[^"]*meta-section-[12][^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  }
  // Fallback: JSON-LD articleBody
  if (!body) {
    const ld = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (ld) {
      try {
        const data = JSON.parse(ld[1]);
        const arr = Array.isArray(data) ? data : [data];
        for (const item of arr) {
          if (item?.articleBody && typeof item.articleBody === "string" && item.articleBody.length > 200) {
            body = item.articleBody;
            break;
          }
        }
      } catch {}
    }
  }

  if (!body) return "";

  let md = body
    // Strip script/style
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    // Headings
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n\n# $1\n\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n### $1\n\n")
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n\n#### $1\n\n")
    // Lists
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, inner) =>
      "\n" + inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n") + "\n"
    )
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, inner) => {
      let i = 0;
      return "\n" + inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, () => `${++i}. $1\n`) + "\n";
    })
    // Inline emphasis
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*")
    // Links
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    // Images
    .replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, "![$2]($1)")
    .replace(/<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*>/gi, "![$1]($2)")
    .replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, "![]($1)")
    // Blockquote
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner) =>
      "\n\n" + inner.replace(/<\/?p[^>]*>/gi, "").trim().split("\n").map((l) => "> " + l).join("\n") + "\n\n"
    )
    // Paragraphs
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n")
    // Line breaks
    .replace(/<br\s*\/?>/gi, "  \n")
    // Strip remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode entities
    ;
  md = decodeEntities(md);

  // Collapse whitespace
  md = md.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return md;
}

function pexelsAttribution(imgUrl) {
  // GHL set the image but didn't expose photographer in OG. We can't recover it.
  // Leave photographer fields blank; user can fill in via editor later.
  return { photographer: "", photographerUrl: "" };
}

async function fetchPost(slug) {
  const url = `https://blog.songghost.com/post/${slug}`;
  // GHL serves SSR HTML to crawlers and a JS shell to regular browsers.
  // We pose as Googlebot to get the rendered article body.
  const r = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Accept": "text/html",
    },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  const html = await r.text();

  const ogTitle = pickMeta(html, "og:title", "property") || pickMeta(html, "title");
  const ogDesc = pickMeta(html, "og:description", "property") || pickMeta(html, "description");
  const ogImage = pickMeta(html, "og:image", "property");
  // Try to extract a publish date from multiple sources, in order of reliability
  let publishedAt = Date.now();
  const pubMeta = pickMeta(html, "article:published_time", "property");
  if (pubMeta) {
    const t = Date.parse(pubMeta);
    if (!isNaN(t)) publishedAt = t;
  } else {
    const ld = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (ld) {
      try {
        const data = JSON.parse(ld[1]);
        const arr = Array.isArray(data) ? data : [data];
        for (const item of arr) {
          const dp = item?.datePublished || item?.dateCreated;
          if (dp) {
            const t = Date.parse(dp);
            if (!isNaN(t)) { publishedAt = t; break; }
          }
        }
      } catch {}
    }
  }
  // Final fallback: hunt for any visible date string in the page text
  if (Math.abs(publishedAt - Date.now()) < 5000) {
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");
    const m = stripped.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/);
    if (m) {
      const t = Date.parse(m[0]);
      if (!isNaN(t)) publishedAt = t;
    }
  }

  const bodyMarkdown = htmlToMarkdown(html);
  const cred = pexelsAttribution(ogImage);

  return {
    slug,
    title: ogTitle.trim(),
    description: ogDesc.trim(),
    bodyMarkdown,
    headerImageUrl: ogImage,
    headerImagePhotographer: cred.photographer,
    headerImagePhotographerUrl: cred.photographerUrl,
    publishedAt,
  };
}

async function main() {
  const url = process.env.CONVEX_URL;
  const key = process.env.CONVEX_ADMIN_KEY;
  if (!url || !key) { console.error("Missing CONVEX_URL or CONVEX_ADMIN_KEY"); process.exit(1); }
  const client = new ConvexHttpClient(url);
  client.setAdminAuth(key);

  console.log(`> Upserting author ${OWNER.email}`);
  const a = await client.mutation(upsertAuthor, OWNER);
  console.log(" ", a);

  for (const slug of SLUGS) {
    console.log(`> Migrating /post/${slug}`);
    try {
      const p = await fetchPost(slug);
      if (!p.title) throw new Error("No title parsed");
      if (!p.headerImageUrl) console.warn("  ! No header image found");
      if (!p.bodyMarkdown || p.bodyMarkdown.length < 80) console.warn(`  ! Body looks short (${p.bodyMarkdown.length} chars)`);
      const res = await client.mutation(upsertPost, {
        slug: p.slug,
        title: p.title,
        description: p.description,
        bodyMarkdown: p.bodyMarkdown || "_Content pending — re-import from GHL or rewrite._",
        headerImageUrl: p.headerImageUrl,
        headerImageAlt: p.title,
        headerImagePhotographer: p.headerImagePhotographer || undefined,
        headerImagePhotographerUrl: p.headerImagePhotographerUrl || undefined,
        tags: [],
        authorEmail: OWNER.email,
        publishedAt: p.publishedAt,
      });
      console.log(`  ${res.created ? "created" : "updated"} (${p.bodyMarkdown.length} chars)`);
    } catch (e) {
      console.error(`  FAILED: ${e.message}`);
    }
  }
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
