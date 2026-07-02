import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionFromRequest } from "@/lib/auth";
import { adminClient, refs } from "@/lib/convex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = adminClient();
  const posts = await client.mutation(refs.adminListAll, { authorEmail: session.email });
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const client = adminClient();
  try {
    const { id } = await client.mutation(refs.adminCreate, {
      authorEmail: session.email,
      slug: body.slug,
      title: body.title,
      description: body.description,
      bodyMarkdown: body.bodyMarkdown,
      headerImageUrl: body.headerImageUrl,
      headerImageAlt: body.headerImageAlt,
      headerImagePhotographer: body.headerImagePhotographer,
      headerImagePhotographerUrl: body.headerImagePhotographerUrl,
      tags: body.tags || [],
      status: body.status || "draft",
      publishedAt: body.publishedAt,
      scheduledFor: body.scheduledFor,
    });
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    revalidatePath("/rss.xml");
    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Create failed" }, { status: 400 });
  }
}
