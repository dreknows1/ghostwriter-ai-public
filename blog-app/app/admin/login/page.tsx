"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    const r = await fetch("/api/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(data.error || "Login failed"); return; }
    window.location.href = "/admin";
  }

  return (
    <div style={{ maxWidth: 380, margin: "60px auto" }}>
      <h1>Admin sign in</h1>
      <form onSubmit={submit} className="editor" style={{ display: "block" }}>
        <div className="field">
          <label>Email</label>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {err && <div className="error">{err}</div>}
        <button className="btn primary" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
      </form>
    </div>
  );
}
