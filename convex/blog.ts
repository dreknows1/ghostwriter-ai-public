import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";


function normEmail(e: string) {
  return e.toLowerCase().trim();
}

function normSlug(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

async function requireAuthor(ctx: any, email: string) {
  const e = normEmail(email);
  const author = await ctx.db
    .query("blogAuthors")
    .withIndex("by_email", (q: any) => q.eq("email", e))
    .first();
  if (!author || !author.canPublish) {
    throw new Error("Not authorized");
  }
  return author;
}

export const listPublished = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: any, args: any) => {
    const limit = Math.max(1, Math.min(args.limit ?? 50, 200));
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_status_publishedAt", (q: any) => q.eq("status", "published"))
      .order("desc")
      .take(limit);

    const authorEmails: string[] = Array.from(new Set(posts.map((p: any) => p.authorEmail as string)));
    const authors = await Promise.all(
      authorEmails.map(async (email) => {
        const a = await ctx.db
          .query("blogAuthors")
          .withIndex("by_email", (q: any) => q.eq("email", email))
          .first();
        return a;
      })
    );
    const authorMap = new Map<string, any>(
      authors.filter(Boolean).map((a: any) => [a.email, a])
    );

    return posts.map((p: any) => ({
      ...p,
      author: authorMap.get(p.authorEmail) || { email: p.authorEmail, name: p.authorEmail },
    }));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx: any, args: any) => {
    const slug = normSlug(args.slug);
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .first();
    if (!post || post.status !== "published") return null;
    const author = await ctx.db
      .query("blogAuthors")
      .withIndex("by_email", (q: any) => q.eq("email", post.authorEmail))
      .first();
    return { ...post, author: author || { email: post.authorEmail, name: post.authorEmail } };
  },
});

export const getAllPublishedSlugs = query({
  args: {},
  handler: async (ctx: any) => {
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_status_publishedAt", (q: any) => q.eq("status", "published"))
      .collect();
    return posts.map((p: any) => ({ slug: p.slug, publishedAt: p.publishedAt, updatedAt: p.updatedAt }));
  },
});

// ---- Admin (called server-side from blog-app via admin auth wrapper) ----

export const adminListAll = internalMutation({
  args: { authorEmail: v.string() },
  handler: async (ctx: any, args: any) => {
    await requireAuthor(ctx, args.authorEmail);
    const posts = await ctx.db.query("blogPosts").order("desc").collect();
    return posts;
  },
});

export const adminGetById = internalMutation({
  args: { authorEmail: v.string(), id: v.id("blogPosts") },
  handler: async (ctx: any, args: any) => {
    await requireAuthor(ctx, args.authorEmail);
    const post = await ctx.db.get(args.id);
    return post;
  },
});

export const adminCreate = internalMutation({
  args: {
    authorEmail: v.string(),
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    bodyMarkdown: v.string(),
    headerImageUrl: v.string(),
    headerImageAlt: v.optional(v.string()),
    headerImagePhotographer: v.optional(v.string()),
    headerImagePhotographerUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    status: v.string(),
    publishedAt: v.optional(v.number()),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    await requireAuthor(ctx, args.authorEmail);
    const slug = normSlug(args.slug);
    if (!slug) throw new Error("Invalid slug");

    const existing = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .first();
    if (existing) throw new Error("Slug already exists");

    const now = Date.now();
    const id = await ctx.db.insert("blogPosts", {
      slug,
      title: args.title,
      description: args.description,
      bodyMarkdown: args.bodyMarkdown,
      headerImageUrl: args.headerImageUrl,
      headerImageAlt: args.headerImageAlt,
      headerImagePhotographer: args.headerImagePhotographer,
      headerImagePhotographerUrl: args.headerImagePhotographerUrl,
      tags: args.tags,
      authorEmail: normEmail(args.authorEmail),
      status: args.status,
      publishedAt: args.status === "published" ? args.publishedAt ?? now : args.publishedAt,
      scheduledFor: args.scheduledFor,
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  },
});

export const adminUpdate = internalMutation({
  args: {
    authorEmail: v.string(),
    id: v.id("blogPosts"),
    slug: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    bodyMarkdown: v.optional(v.string()),
    headerImageUrl: v.optional(v.string()),
    headerImageAlt: v.optional(v.string()),
    headerImagePhotographer: v.optional(v.string()),
    headerImagePhotographerUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    await requireAuthor(ctx, args.authorEmail);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Not found");

    const patch: any = { updatedAt: Date.now() };
    if (args.slug !== undefined) {
      const slug = normSlug(args.slug);
      if (!slug) throw new Error("Invalid slug");
      if (slug !== existing.slug) {
        const conflict = await ctx.db
          .query("blogPosts")
          .withIndex("by_slug", (q: any) => q.eq("slug", slug))
          .first();
        if (conflict) throw new Error("Slug already exists");
        patch.slug = slug;
      }
    }
    for (const k of [
      "title",
      "description",
      "bodyMarkdown",
      "headerImageUrl",
      "headerImageAlt",
      "headerImagePhotographer",
      "headerImagePhotographerUrl",
      "tags",
      "status",
      "publishedAt",
      "scheduledFor",
    ]) {
      if (args[k] !== undefined) patch[k] = args[k];
    }
    if (patch.status === "published" && !patch.publishedAt && !existing.publishedAt) {
      patch.publishedAt = Date.now();
    }
    await ctx.db.patch(args.id, patch);
    return { ok: true };
  },
});

export const adminDelete = internalMutation({
  args: { authorEmail: v.string(), id: v.id("blogPosts") },
  handler: async (ctx: any, args: any) => {
    await requireAuthor(ctx, args.authorEmail);
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});

export const listAuthors = query({
  args: {},
  handler: async (ctx: any) => {
    return await ctx.db.query("blogAuthors").collect();
  },
});

// ---- Internal (used by migration + initial setup) ----

export const upsertAuthorInternal = internalMutation({
  args: {
    email: v.string(),
    name: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    twitter: v.optional(v.string()),
    website: v.optional(v.string()),
    canPublish: v.optional(v.boolean()),
    isOwner: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args: any) => {
    const email = normEmail(args.email);
    const existing = await ctx.db
      .query("blogAuthors")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();
    const fields: any = {
      email,
      name: args.name,
      bio: args.bio,
      avatarUrl: args.avatarUrl,
      twitter: args.twitter,
      website: args.website,
      canPublish: args.canPublish ?? true,
      isOwner: args.isOwner ?? false,
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return { id: existing._id, created: false };
    }
    const id = await ctx.db.insert("blogAuthors", { ...fields, createdAt: Date.now() });
    return { id, created: true };
  },
});

export const upsertPostInternal = internalMutation({
  args: {
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    bodyMarkdown: v.string(),
    headerImageUrl: v.string(),
    headerImageAlt: v.optional(v.string()),
    headerImagePhotographer: v.optional(v.string()),
    headerImagePhotographerUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    authorEmail: v.string(),
    publishedAt: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    const slug = normSlug(args.slug);
    const now = Date.now();
    const existing = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .first();
    const fields: any = {
      slug,
      title: args.title,
      description: args.description,
      bodyMarkdown: args.bodyMarkdown,
      headerImageUrl: args.headerImageUrl,
      headerImageAlt: args.headerImageAlt,
      headerImagePhotographer: args.headerImagePhotographer,
      headerImagePhotographerUrl: args.headerImagePhotographerUrl,
      tags: args.tags,
      authorEmail: normEmail(args.authorEmail),
      status: "published",
      publishedAt: args.publishedAt,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return { id: existing._id, created: false };
    }
    const id = await ctx.db.insert("blogPosts", { ...fields, createdAt: now });
    return { id, created: true };
  },
});

export const listAllInternal = internalQuery({
  handler: async (ctx: any) => {
    return await ctx.db.query("blogPosts").order("desc").collect();
  },
});
