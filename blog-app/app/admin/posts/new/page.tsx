import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import PostEditor from "@/components/PostEditor";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return (
    <>
      <h1>New post</h1>
      <PostEditor />
    </>
  );
}
