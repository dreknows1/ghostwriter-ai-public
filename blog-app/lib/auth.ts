import type { NextRequest } from "next/server";
import { cookies as nextCookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "sg_blog_admin";
const ONE_WEEK = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.ADMIN_PASSWORD || "";
  if (!s) throw new Error("Missing ADMIN_PASSWORD env");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function makeSessionToken(email: string): string {
  const exp = Math.floor(Date.now() / 1000) + ONE_WEEK;
  const payload = `${email}.${exp}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifySessionToken(token: string): { email: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    // The signature is the last dot-segment, the exp is the second-to-last, and
    // everything before that is the email (which itself can contain dots, e.g. gmail.com).
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot < 0) return null;
    const sig = decoded.slice(lastDot + 1);
    const rest = decoded.slice(0, lastDot);
    const secondLastDot = rest.lastIndexOf(".");
    if (secondLastDot < 0) return null;
    const expStr = rest.slice(secondLastDot + 1);
    const email = rest.slice(0, secondLastDot);
    if (!email || !expStr || !sig) return null;
    const expected = sign(`${email}.${expStr}`);
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    if (Number(expStr) < Math.floor(Date.now() / 1000)) return null;
    return { email };
  } catch {
    return null;
  }
}

// For Server Components / generateMetadata / etc.
export async function getSession(): Promise<{ email: string } | null> {
  try {
    const c = nextCookies().get(COOKIE_NAME);
    if (!c) return null;
    return verifySessionToken(c.value);
  } catch {
    return null;
  }
}

// For Route Handlers — read directly from the request. Vercel passes a
// NextRequest (has .cookies); fall back to parsing the Cookie header.
export function getSessionFromRequest(req: NextRequest | Request): { email: string } | null {
  try {
    let value: string | undefined;
    const anyReq = req as any;
    if (anyReq.cookies && typeof anyReq.cookies.get === "function") {
      const c = anyReq.cookies.get(COOKIE_NAME);
      if (c) value = typeof c === "string" ? c : c.value;
    }
    if (!value) {
      const cookieHeader = req.headers.get("cookie") || "";
      for (const part of cookieHeader.split(/;\s*/)) {
        const i = part.indexOf("=");
        if (i > 0 && part.slice(0, i) === COOKIE_NAME) {
          value = decodeURIComponent(part.slice(i + 1));
          break;
        }
      }
    }
    if (!value) return null;
    return verifySessionToken(value);
  } catch {
    return null;
  }
}

export function cookieName() {
  return COOKIE_NAME;
}

export function cookieMaxAge() {
  return ONE_WEEK;
}
