import { createHmac } from "node:crypto";

const SESSION_COOKIE = "sg_session_token";

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || "songghost-dev-session-secret";
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function buildSessionToken(email: string): string {
  const payload = JSON.stringify({ email, iat: Date.now() });
  const encoded = toBase64Url(payload);
  const sig = createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function readCookieValue(cookieHeader: string | undefined, key: string): string {
  const raw = String(cookieHeader || "");
  const parts = raw.split(";").map((entry) => entry.trim());
  const match = parts.find((entry) => entry.startsWith(`${key}=`));
  return match ? decodeURIComponent(match.slice(key.length + 1)) : "";
}

export function getSessionEmailFromRequest(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const cookieHeader = Array.isArray(req.headers.cookie) ? req.headers.cookie.join("; ") : req.headers.cookie;
  const token = readCookieValue(cookieHeader, SESSION_COOKIE);
  if (!token || !token.includes(".")) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
  if (expected !== signature) return null;
  try {
    const payload = JSON.parse(fromBase64Url(encoded));
    const email = String(payload?.email || "").toLowerCase().trim();
    if (!email.includes("@")) return null;
    return email;
  } catch {
    return null;
  }
}

export function buildSessionCookie(email: string): string {
  const token = buildSessionToken(email);
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure`;
}

export function buildSessionClearCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}
