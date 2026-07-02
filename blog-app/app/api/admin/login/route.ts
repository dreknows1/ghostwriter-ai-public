import { NextResponse } from "next/server";
import { makeSessionToken, cookieName, cookieMaxAge } from "@/lib/auth";
import { adminClient, refs } from "@/lib/convex";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Confirm this email is a registered author with publish permission.
  const client = adminClient();
  const authors: any[] = await client.query(refs.listAuthors, {});
  const found = authors.find((a) => a.email === email && a.canPublish);
  if (!found) {
    return NextResponse.json({ error: "Email is not a registered author" }, { status: 403 });
  }

  const token = makeSessionToken(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: cookieMaxAge(),
  });
  return res;
}
