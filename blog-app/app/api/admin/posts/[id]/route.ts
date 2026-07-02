import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionFromRequest } from "@/lib/auth";
import { adminClient, refs } from "@/lib/convex";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = adminClient();
  const post = await client.mutation(refs.adminGetById, { authorEmail: session.email, id: params.id as any });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const client = adminClient();
  try {
    await client.mutation(refs.adminUpdate, {
      authorEmail: session.email,
      id: params.id as any,
      slug: body.slug,
      title: body.title,
      description: body.description,
      bodyMarkdown: body.bodyMarkdown,
      headerImageUrl: body.headerImageUrl,
      headerImageAlt: body.headerImageAlt,
      headerImagePhotographer: body.headerImagePhotographer,
      headerImagePhotographerUrl: body.headerImagePhotographerUrl,
      tags: body.tags,
      status: body.status,
      publishedAt: body.publishedAt,
      scheduledFor: body.scheduledFor,
    });
    revalidatePath("/");
    if (body.slug) revalidatePath(`/${body.slug}`);
    revalidatePath("/sitemap.xml");
    revalidatePath("/rss.xml");
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Update failed" }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = adminClient();
  try {
    await client.mutation(refs.adminDelete, { authorEmail: session.email, id: params.id as any });
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    revalidatePath("/rss.xml");
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Delete failed" }, { status: 400 });
  }
}
