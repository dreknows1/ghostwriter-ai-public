import { publicClient, refs, BlogPost } from "@/lib/convex";
import { readingTimeMinutes } from "@/lib/markdown";

export const revalidate = 60;

function fmtDate(ts?: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function Home() {
  const client = publicClient();
  const posts: BlogPost[] = await client.query(refs.listPublished, { limit: 50 });

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>The Pit</h1>
          <p>Songwriting craft, AI music tools, and the stories behind the songs.</p>
        </div>
      </section>

      <div className="container post-grid">
        {posts.length === 0 && <div className="muted">No posts yet — check back soon.</div>}
        {posts.map((p) => (
          <article key={p._id} className="post-card">
            <a className="thumb" href={`/${p.slug}`} aria-label={p.title}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.headerImageUrl} alt={p.headerImageAlt || p.title} loading="lazy" />
            </a>
            <div>
              <div className="meta">
                {fmtDate(p.publishedAt)} · {readingTimeMinutes(p.bodyMarkdown)} min read
                {p.author?.name ? <> · by {p.author.name}</> : null}
              </div>
              <h2><a href={`/${p.slug}`}>{p.title}</a></h2>
              <p>{p.description}</p>
              {p.tags?.length ? (
                <div style={{ marginTop: 10 }}>
                  {p.tags.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
