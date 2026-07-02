import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

const URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

export function publicClient() {
  if (!URL) throw new Error("Missing CONVEX_URL");
  return new ConvexHttpClient(URL);
}

export function adminClient() {
  if (!URL) throw new Error("Missing CONVEX_URL");
  const key = process.env.CONVEX_ADMIN_KEY;
  if (!key) throw new Error("Missing CONVEX_ADMIN_KEY");
  const c: any = new ConvexHttpClient(URL);
  c.setAdminAuth(key);
  return c;
}

export const refs = {
  listPublished: makeFunctionReference<"query">("blog:listPublished"),
  getBySlug: makeFunctionReference<"query">("blog:getBySlug"),
  getAllPublishedSlugs: makeFunctionReference<"query">("blog:getAllPublishedSlugs"),
  listAuthors: makeFunctionReference<"query">("blog:listAuthors"),
  adminListAll: makeFunctionReference<"mutation">("blog:adminListAll"),
  adminGetById: makeFunctionReference<"mutation">("blog:adminGetById"),
  adminCreate: makeFunctionReference<"mutation">("blog:adminCreate"),
  adminUpdate: makeFunctionReference<"mutation">("blog:adminUpdate"),
  adminDelete: makeFunctionReference<"mutation">("blog:adminDelete"),
};

export type BlogAuthor = {
  _id?: string;
  email: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  twitter?: string;
  website?: string;
  canPublish?: boolean;
  isOwner?: boolean;
};

export type BlogPost = {
  _id: string;
  slug: string;
  title: string;
  description: string;
  bodyMarkdown: string;
  headerImageUrl: string;
  headerImageAlt?: string;
  headerImagePhotographer?: string;
  headerImagePhotographerUrl?: string;
  tags: string[];
  authorEmail: string;
  status: "draft" | "scheduled" | "published";
  publishedAt?: number;
  scheduledFor?: number;
  createdAt: number;
  updatedAt: number;
  author?: BlogAuthor;
};
