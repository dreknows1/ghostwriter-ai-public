import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { adminClient, refs } from "@/lib/convex";
import AdminPostsList from "./PostsList";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const client = adminClient();
  const posts = await client.mutation(refs.adminListAll, { authorEmail: session.email });

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Posts</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <a className="btn primary" href="/admin/posts/new">New post</a>
          <form action="/api/admin/logout" method="post">
            <button className="btn" type="submit">Sign out</button>
          </form>
        </div>
      </div>
      <p className="muted">Signed in as <strong>{session.email}</strong></p>
      <AdminPostsList initialPosts={posts as any} />
    </>
  );
}
