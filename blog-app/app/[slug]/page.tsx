import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicClient, refs, BlogPost } from "@/lib/convex";
import { renderMarkdown, readingTimeMinutes } from "@/lib/markdown";

export const revalidate = 60;
export const dynamicParams = true;

const SITE_URL = process.env.SITE_URL || "https://blog.songghost.com";

export async function generateStaticParams() {
  try {
    const client = publicClient();
    const slugs: { slug: string }[] = await client.query(refs.getAllPublishedSlugs, {});
    return slugs.map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

async function loadPost(slug: string): Promise<BlogPost | null> {
  const client = publicClient();
  return await client.query(refs.getBySlug, { slug });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await loadPost(params.slug);
  if (!post) return { title: "Not found" };
  const url = `${SITE_URL}/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      images: [{ url: post.headerImageUrl, alt: post.headerImageAlt || post.title }],
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime: new Date(post.updatedAt).toISOString(),
      authors: post.author?.name ? [post.author.name] : undefined,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.headerImageUrl],
    },
  };
}

function fmtDate(ts?: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await loadPost(params.slug);
  if (!post) notFound();

  const html = await renderMarkdown(post.bodyMarkdown);
  const url = `${SITE_URL}/${post.slug}`;

  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: [post.headerImageUrl],
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified: new Date(post.updatedAt).toISOString(),
    author: [{
      "@type": "Person",
      name: post.author?.name || post.authorEmail,
      url: post.author?.website,
    }],
    publisher: {
      "@type": "Organization",
      name: "Song Ghost",
      url: "https://www.songghost.com",
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <article className="container">
      <div className="post-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.headerImageUrl} alt={post.headerImageAlt || post.title} />
        {post.headerImagePhotographer && (
          <div className="credit">
            Photo by{" "}
            {post.headerImagePhotographerUrl ? (
              <a href={post.headerImagePhotographerUrl} target="_blank" rel="noopener noreferrer nofollow">
                {post.headerImagePhotographer}
              </a>
            ) : (
              post.headerImagePhotographer
            )}
            {" "}on{" "}
            <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer nofollow">Pexels</a>
          </div>
        )}
      </div>

      <div className="post-meta">
        {post.author?.name && <span className="author">{post.author.name}</span>}
        <span className="dot">·</span>
        <span>{fmtDate(post.publishedAt)}</span>
        <span className="dot">·</span>
        <span>{readingTimeMinutes(post.bodyMarkdown)} min read</span>
        {post.tags?.length ? (
          <>
            <span className="dot">·</span>
            <span>{post.tags.map((t) => <span key={t} className="tag">{t}</span>)}</span>
          </>
        ) : null}
      </div>

      <h1 className="post-title">{post.title}</h1>
      <p className="post-desc">{post.description}</p>

      <div className="post-body" dangerouslySetInnerHTML={{ __html: html }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </article>
  );
}
