import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { adminClient, refs } from "@/lib/convex";
import PostEditor from "@/components/PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const client = adminClient();
  const post: any = await client.mutation(refs.adminGetById, { authorEmail: session.email, id: params.id as any });
  if (!post) notFound();

  return (
    <>
      <h1>Edit post</h1>
      <PostEditor
        postId={params.id}
        initial={{
          slug: post.slug,
          title: post.title,
          description: post.description,
          bodyMarkdown: post.bodyMarkdown,
          headerImageUrl: post.headerImageUrl,
          headerImageAlt: post.headerImageAlt || "",
          headerImagePhotographer: post.headerImagePhotographer || "",
          headerImagePhotographerUrl: post.headerImagePhotographerUrl || "",
          tags: (post.tags || []).join(", "),
          status: post.status,
          publishedAtTs: post.publishedAt,
          scheduledForTs: post.scheduledFor,
        }}
      />
    </>
  );
}
