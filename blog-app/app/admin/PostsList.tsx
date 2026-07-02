"use client";
import { useState } from "react";
import type { BlogPost } from "@/lib/convex";

function fmt(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString();
}

export default function AdminPostsList({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [busy, setBusy] = useState<string | null>(null);

  async function del(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(id);
    const r = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    setBusy(null);
    if (r.ok) {
      setPosts((p) => p.filter((x) => x._id !== id));
    } else {
      const data = await r.json().catch(() => ({}));
      alert(data.error || "Delete failed");
    }
  }

  return (
    <table className="admin-table" style={{ marginTop: 24 }}>
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Author</th>
          <th>Published</th>
          <th>Updated</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {posts.length === 0 && (
          <tr><td colSpan={6} className="muted" style={{ padding: 24 }}>No posts yet. <a href="/admin/posts/new">Create one</a>.</td></tr>
        )}
        {posts.map((p) => (
          <tr key={p._id}>
            <td><a href={`/admin/posts/edit/${p._id}`}><strong>{p.title}</strong></a><br /><span className="muted">/{p.slug}</span></td>
            <td><span className={`status-${p.status}`}>{p.status}</span></td>
            <td>{p.authorEmail}</td>
            <td>{fmt(p.publishedAt)}</td>
            <td>{fmt(p.updatedAt)}</td>
            <td style={{ textAlign: "right" }}>
              {p.status === "published" && <a className="btn" href={`/${p.slug}`} target="_blank">View</a>}
              {" "}
              <a className="btn" href={`/admin/posts/edit/${p._id}`}>Edit</a>
              {" "}
              <button className="btn danger" disabled={busy === p._id} onClick={() => del(p._id, p.title)}>
                {busy === p._id ? "..." : "Delete"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
