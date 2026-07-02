"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type PexelsPhoto = {
  id: number; width: number; height: number;
  photographer: string; photographerUrl: string;
  alt: string; pageUrl: string;
  src: { original: string; large2x: string; large: string; medium: string; tiny: string };
};

export type PostFormState = {
  slug: string;
  title: string;
  description: string;
  bodyMarkdown: string;
  headerImageUrl: string;
  headerImageAlt: string;
  headerImagePhotographer: string;
  headerImagePhotographerUrl: string;
  tags: string;
  status: "draft" | "scheduled" | "published";
  publishedAt: string; // datetime-local
  scheduledFor: string;
};

export const EMPTY_POST: PostFormState = {
  slug: "", title: "", description: "", bodyMarkdown: "",
  headerImageUrl: "", headerImageAlt: "", headerImagePhotographer: "", headerImagePhotographerUrl: "",
  tags: "", status: "draft", publishedAt: "", scheduledFor: "",
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}

function localToTs(s: string): number | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d.getTime();
}

function tsToLocal(ts?: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PostEditor({
  initial, postId,
}: {
  initial?: Partial<PostFormState> & { publishedAtTs?: number; scheduledForTs?: number };
  postId?: string;
}) {
  const [form, setForm] = useState<PostFormState>(() => ({
    ...EMPTY_POST,
    ...initial,
    publishedAt: initial?.publishedAtTs ? tsToLocal(initial.publishedAtTs) : (initial?.publishedAt || ""),
    scheduledFor: initial?.scheduledForTs ? tsToLocal(initial.scheduledForTs) : (initial?.scheduledFor || ""),
  }));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [showPexels, setShowPexels] = useState<null | "header" | "inline">(null);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const slugTouched = useRef(!!initial?.slug);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function update<K extends keyof PostFormState>(key: K, value: PostFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Auto-slug from title until user manually edits slug
  useEffect(() => {
    if (!slugTouched.current) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }
  }, [form.title]);

  // Live markdown preview (debounced)
  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(async () => {
      try {
        const r = await fetch("/api/admin/preview", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ md: form.bodyMarkdown }),
        });
        if (!r.ok) return;
        const { html } = await r.json();
        if (!cancelled) setPreviewHtml(html);
      } catch {}
    }, 250);
    return () => { cancelled = true; clearTimeout(id); };
  }, [form.bodyMarkdown]);

  function insertAtCursor(text: string) {
    const ta = bodyRef.current;
    if (!ta) { update("bodyMarkdown", form.bodyMarkdown + text); return; }
    const start = ta.selectionStart ?? form.bodyMarkdown.length;
    const end = ta.selectionEnd ?? form.bodyMarkdown.length;
    const next = form.bodyMarkdown.slice(0, start) + text + form.bodyMarkdown.slice(end);
    update("bodyMarkdown", next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + text.length;
    });
  }

  function selectPexels(photo: PexelsPhoto) {
    if (showPexels === "header") {
      setForm((f) => ({
        ...f,
        headerImageUrl: photo.src.large2x || photo.src.large || photo.src.original,
        headerImageAlt: photo.alt || f.headerImageAlt,
        headerImagePhotographer: photo.photographer,
        headerImagePhotographerUrl: photo.photographerUrl,
      }));
    } else if (showPexels === "inline") {
      const md = `\n\n![${(photo.alt || "Image").replace(/\]/g, "")}](${photo.src.large || photo.src.original})\n*Photo by [${photo.photographer}](${photo.photographerUrl}) on [Pexels](https://www.pexels.com)*\n\n`;
      insertAtCursor(md);
    }
    setShowPexels(null);
  }

  async function runAi(action: string) {
    const useBody = action === "title" || action === "description" || action === "polish" || action === "tags";
    const useTitle = action === "outline";
    const input = useBody ? form.bodyMarkdown : useTitle ? form.title : "";
    if (!input.trim()) {
      setMsg({ kind: "error", text: action === "outline" ? "Enter a title first." : "Write some body content first." });
      return;
    }
    setAiBusy(action); setMsg(null);
    const r = await fetch("/api/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, input }),
    });
    setAiBusy(null);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg({ kind: "error", text: data.error || "AI failed" }); return; }
    if (action === "title") {
      alert("Title suggestions:\n\n" + data.text);
    } else if (action === "description") {
      update("description", data.text.replace(/^["']|["']$/g, "").trim());
    } else if (action === "outline") {
      update("bodyMarkdown", form.bodyMarkdown ? form.bodyMarkdown + "\n\n" + data.text : data.text);
    } else if (action === "polish") {
      update("bodyMarkdown", data.text);
    } else if (action === "tags") {
      update("tags", data.text.replace(/[\n\r]/g, "").trim());
    }
  }

  async function save(publishNow?: boolean) {
    setMsg(null);
    if (!form.title.trim()) { setMsg({ kind: "error", text: "Title is required." }); return; }
    if (!form.slug.trim()) { setMsg({ kind: "error", text: "Slug is required." }); return; }
    if (!form.headerImageUrl.trim()) { setMsg({ kind: "error", text: "Header image is required." }); return; }
    if (!form.description.trim()) { setMsg({ kind: "error", text: "Description is required." }); return; }

    const status = publishNow ? "published" : form.status;
    const payload = {
      slug: form.slug,
      title: form.title,
      description: form.description,
      bodyMarkdown: form.bodyMarkdown,
      headerImageUrl: form.headerImageUrl,
      headerImageAlt: form.headerImageAlt || undefined,
      headerImagePhotographer: form.headerImagePhotographer || undefined,
      headerImagePhotographerUrl: form.headerImagePhotographerUrl || undefined,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      status,
      publishedAt: localToTs(form.publishedAt) ?? (publishNow ? Date.now() : undefined),
      scheduledFor: localToTs(form.scheduledFor),
    };

    setSaving(true);
    const r = postId
      ? await fetch(`/api/admin/posts/${postId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/posts", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setSaving(false);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg({ kind: "error", text: data.error || "Save failed" }); return; }
    setMsg({ kind: "success", text: publishNow ? "Published." : "Saved." });
    if (!postId && data.id) {
      window.location.href = `/admin/posts/edit/${data.id}`;
    }
  }

  return (
    <>
      <div className="editor">
        <div>
          <div className="field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Post title" />
          </div>
          <div className="field">
            <label>Slug (URL)</label>
            <input
              value={form.slug}
              onChange={(e) => { slugTouched.current = true; update("slug", slugify(e.target.value)); }}
              placeholder="how-to-write-a-bridge"
            />
            <div className="muted" style={{ marginTop: 4 }}>blog.songghost.com/{form.slug || "..."}</div>
          </div>
          <div className="field">
            <label>Description (160 chars, used for SEO + cards)</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              style={{ minHeight: 80 }}
              maxLength={200}
            />
            <div className="muted">{form.description.length} / 160 recommended</div>
          </div>
          <div className="field">
            <label>Header image</label>
            {form.headerImageUrl ? (
              <div style={{ marginBottom: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.headerImageUrl} alt="" style={{ borderRadius: 8, maxHeight: 180, objectFit: "cover", width: "100%" }} />
                {form.headerImagePhotographer && (
                  <div className="muted" style={{ marginTop: 4 }}>Photo by {form.headerImagePhotographer} on Pexels</div>
                )}
              </div>
            ) : null}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" type="button" onClick={() => setShowPexels("header")}>Search Pexels</button>
              {form.headerImageUrl && (
                <button className="btn" type="button" onClick={() => setForm((f) => ({ ...f, headerImageUrl: "", headerImagePhotographer: "", headerImagePhotographerUrl: "" }))}>Clear</button>
              )}
            </div>
            <input
              style={{ marginTop: 8 }}
              placeholder="Or paste an image URL directly"
              value={form.headerImageUrl}
              onChange={(e) => update("headerImageUrl", e.target.value)}
            />
            <input
              style={{ marginTop: 8 }}
              placeholder="Alt text"
              value={form.headerImageAlt}
              onChange={(e) => update("headerImageAlt", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Tags (comma-separated)</label>
            <input value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="songwriting, ai-music, craft" />
          </div>
          <div className="field" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label>Status</label>
              <select value={form.status} onChange={(e) => update("status", e.target.value as any)}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label>Publish date</label>
              <input type="datetime-local" value={form.publishedAt} onChange={(e) => update("publishedAt", e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Body (Markdown)</label>
            <textarea
              ref={bodyRef}
              value={form.bodyMarkdown}
              onChange={(e) => update("bodyMarkdown", e.target.value)}
              placeholder="Write your post in Markdown..."
            />
          </div>
          <div className="toolbar">
            <button className="btn" type="button" onClick={() => setShowPexels("inline")}>Insert image</button>
            <button className="btn" type="button" onClick={() => insertAtCursor("\n\n## Heading\n\n")}>+ Heading</button>
            <button className="btn" type="button" onClick={() => insertAtCursor("\n\n> Quote\n\n")}>+ Quote</button>
            <button className="btn" type="button" disabled={aiBusy === "outline"} onClick={() => runAi("outline")}>{aiBusy === "outline" ? "..." : "AI: Outline"}</button>
            <button className="btn" type="button" disabled={aiBusy === "polish"} onClick={() => runAi("polish")}>{aiBusy === "polish" ? "..." : "AI: Polish"}</button>
            <button className="btn" type="button" disabled={aiBusy === "title"} onClick={() => runAi("title")}>{aiBusy === "title" ? "..." : "AI: Suggest titles"}</button>
            <button className="btn" type="button" disabled={aiBusy === "description"} onClick={() => runAi("description")}>{aiBusy === "description" ? "..." : "AI: Description"}</button>
            <button className="btn" type="button" disabled={aiBusy === "tags"} onClick={() => runAi("tags")}>{aiBusy === "tags" ? "..." : "AI: Tags"}</button>
          </div>
        </div>

        <div>
          <label>Live preview</label>
          <div className="preview">
            {form.headerImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.headerImageUrl} alt="" style={{ borderRadius: 8, marginBottom: 16 }} />
            )}
            <h1 style={{ marginTop: 0 }}>{form.title || "Untitled"}</h1>
            <p style={{ color: "var(--fg-soft)" }}>{form.description}</p>
            <div className="post-body" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "16px 0", borderTop: "1px solid var(--border)" }}>
        <button className="btn" type="button" disabled={saving} onClick={() => save(false)}>{saving ? "Saving..." : "Save"}</button>
        <button className="btn primary" type="button" disabled={saving} onClick={() => save(true)}>Publish now</button>
        <a className="btn" href="/admin">Back to posts</a>
      </div>
      {msg && <div className={msg.kind}>{msg.text}</div>}

      {showPexels && <PexelsPicker onClose={() => setShowPexels(null)} onPick={selectPexels} mode={showPexels} />}
    </>
  );
}

function PexelsPicker({ onClose, onPick, mode }: { onClose: () => void; onPick: (p: PexelsPhoto) => void; mode: "header" | "inline" }) {
  const [q, setQ] = useState("");
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function search(query: string) {
    setLoading(true); setErr(null);
    const r = await fetch(`/api/pexels?q=${encodeURIComponent(query)}&per_page=18&orientation=${mode === "header" ? "landscape" : "landscape"}`);
    setLoading(false);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(data.error || "Search failed"); return; }
    setPhotos(data.photos || []);
  }

  useEffect(() => { search(""); /* curated initial */ }, []);

  return (
    <div className="pexels-modal" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <header>
          <input
            placeholder={`Search Pexels for ${mode === "header" ? "header image" : "inline image"}...`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") search(q); }}
            style={{ flex: 1 }}
          />
          <button className="btn primary" onClick={() => search(q)}>Search</button>
          <button className="btn" onClick={onClose}>Close</button>
        </header>
        <div className="results">
          {loading && <div className="muted" style={{ gridColumn: "1/-1", padding: 24 }}>Loading...</div>}
          {err && <div className="error" style={{ gridColumn: "1/-1" }}>{err}</div>}
          {!loading && photos.length === 0 && <div className="muted" style={{ gridColumn: "1/-1" }}>No results.</div>}
          {photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.id} src={p.src.medium} alt={p.alt} title={`Photo by ${p.photographer}`} onClick={() => onPick(p)} />
          ))}
        </div>
      </div>
    </div>
  );
}
