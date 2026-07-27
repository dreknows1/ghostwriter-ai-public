/**
 * The Prompt Book nurture sequence.
 *
 * Nine emails over 26 days, starting the day after someone downloads the book.
 * The day-0 delivery email is sent inline by api/ebook-signup.ts; this picks up
 * from day 1 and never re-sends the book.
 *
 * Why the schedule lives here rather than in a GoHighLevel workflow: GHL cannot
 * create workflows through its API. That was confirmed four ways — a direct
 * probe, HighLevel's public idea board, the project's own ghl-ops tooling, and
 * GHL's in-product AI with full account access. Building one is manual UI work.
 * So Convex owns the timing and GHL owns the sending, which keeps every message
 * on the verified domain and inside the contact's normal GHL conversation.
 *
 * Sending is deliberately idempotent per (subscriber, email number): the cron
 * claims an email by advancing lastSent BEFORE it sends. A crash mid-send can
 * therefore drop one email but can never double-send one, which is the right
 * way round — a missing email is invisible, a duplicate is embarrassing.
 */

import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { NURTURE_EMAILS, LAST_DAY } from "./nurtureEmails";

const DAY_MS = 24 * 60 * 60 * 1000;
const GHL_BASE = "https://services.leadconnectorhq.com";

/** Enrol someone who just downloaded the book. Safe to call repeatedly. */
export const enroll = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    ghlContactId: v.string(),
    // Backfill: enrol someone who downloaded the book before this existed, at
    // the point in the sequence their signup date has already earned. Omit for
    // normal signups, which start from now.
    startedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("nurtureSubscribers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    // A second download must not restart the sequence — same reason the GHL
    // workflow would have had re-entry switched off.
    if (existing) return { enrolled: false, reason: "already enrolled" };

    await ctx.db.insert("nurtureSubscribers", {
      email,
      firstName: args.firstName,
      ghlContactId: args.ghlContactId,
      startedAt: args.startedAt ?? Date.now(),
      lastSent: 0,
      status: "active",
    });
    return { enrolled: true };
  },
});

/** Everyone active, for the cron to filter. */
export const dueNow = internalQuery({
  args: {},
  handler: async (ctx) => {
    const active = await ctx.db
      .query("nurtureSubscribers")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const now = Date.now();
    const due: Array<{
      id: string;
      ghlContactId: string;
      firstName?: string;
      email: string;
      emailN: number;
    }> = [];

    for (const s of active) {
      const daysIn = Math.floor((now - s.startedAt) / DAY_MS);
      // The next email they have not had yet, if its day has arrived. Only ever
      // one per run, so a long-dormant subscriber catches up one step a day
      // rather than getting the whole backlog at once.
      const next = NURTURE_EMAILS.find((e) => e.n === s.lastSent + 1);
      if (next && daysIn >= next.day) {
        due.push({
          id: s._id,
          ghlContactId: s.ghlContactId,
          firstName: s.firstName,
          email: s.email,
          emailN: next.n,
        });
      }
    }
    return due;
  },
});

/** Claim an email before sending, so a retry cannot double-send it. */
export const claim = internalMutation({
  args: { id: v.id("nurtureSubscribers"), emailN: v.number() },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.id);
    if (!s || s.lastSent !== args.emailN - 1) return { claimed: false };
    await ctx.db.patch(args.id, {
      lastSent: args.emailN,
      lastSentAt: Date.now(),
      status: args.emailN >= NURTURE_EMAILS.length ? "completed" : "active",
    });
    return { claimed: true };
  },
});

/** Hand back a claim when the send itself failed, so tomorrow retries it. */
export const release = internalMutation({
  args: { id: v.id("nurtureSubscribers"), emailN: v.number() },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.id);
    if (!s || s.lastSent !== args.emailN) return;
    await ctx.db.patch(args.id, { lastSent: args.emailN - 1, status: "active" });
  },
});

export const stop = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const s = await ctx.db
      .query("nurtureSubscribers")
      .withIndex("by_email", (q) => q.eq("email", args.email.trim().toLowerCase()))
      .unique();
    if (s) await ctx.db.patch(s._id, { status: "stopped" });
    return { stopped: !!s };
  },
});

/** The daily run. */
export const sendDue = internalAction({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const token = process.env.GHL_MESSAGE_TOKEN;
    const from = process.env.GHL_FROM_EMAIL;
    if (!token) {
      console.error("[nurture] GHL_MESSAGE_TOKEN missing — nothing sent");
      return { sent: 0, failed: 0, skipped: "no token" };
    }

    const due = await ctx.runQuery(internal.nurture.dueNow, {});
    let sent = 0;
    let failed = 0;

    for (const d of due) {
      const email = NURTURE_EMAILS.find((e) => e.n === d.emailN)!;
      if (args.dryRun) {
        console.log(`[nurture] would send #${email.n} "${email.subject}" -> ${d.email}`);
        sent++;
        continue;
      }

      const claimed = await ctx.runMutation(internal.nurture.claim, {
        id: d.id as any,
        emailN: d.emailN,
      });
      if (!claimed.claimed) continue;

      const name = (d.firstName || "").trim();
      const body = (s: string) => s.replace(/\{\{contact\.first_name\}\}/g, name || "there");

      try {
        const res = await fetch(`${GHL_BASE}/conversations/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Version: process.env.GHL_API_VERSION || "2021-07-28",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          // No emailTo: GHL resolves the recipient from the contact and rejects
          // the call outright if the value is not already one of that contact's
          // own addresses.
          body: JSON.stringify({
            type: "Email",
            contactId: d.ghlContactId,
            subject: email.subject,
            html: body(email.html),
            message: body(email.text),
            ...(from ? { emailFrom: from } : {}),
          }),
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          console.error(`[nurture] #${email.n} -> ${d.email} failed ${res.status}: ${detail.slice(0, 200)}`);
          await ctx.runMutation(internal.nurture.release, { id: d.id as any, emailN: d.emailN });
          failed++;
          continue;
        }
        sent++;
      } catch (e: any) {
        console.error(`[nurture] #${email.n} -> ${d.email} threw: ${e?.message || e}`);
        await ctx.runMutation(internal.nurture.release, { id: d.id as any, emailN: d.emailN });
        failed++;
      }
    }

    console.log(`[nurture] due=${due.length} sent=${sent} failed=${failed} (sequence runs ${LAST_DAY} days)`);
    return { sent, failed, due: due.length };
  },
});
