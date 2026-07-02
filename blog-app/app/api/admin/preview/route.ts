import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { renderMarkdown } from "@/lib/markdown";

export async function POST(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const md = String(body.md || "");
  const html = await renderMarkdown(md);
  return NextResponse.json({ html });
}
