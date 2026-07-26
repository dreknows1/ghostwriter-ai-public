import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Lead capture for The Prompt Book.
 *
 * Pushes the contact into GoHighLevel using the same credentials the app
 * already uses for signup sync (GHL_API_TOKEN / GHL_LOCATION_ID, set in the
 * Vercel project), tagged so a GHL workflow can pick it up and send the
 * delivery email.
 *
 * The download itself does not depend on this succeeding — the thank-you page
 * links the PDF directly. A CRM hiccup must never cost someone the thing they
 * asked for.
 */

const PDF_URL = "https://songghost.com/the-prompt-book.pdf";

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) && v.length < 254;
}

async function syncToGHL(email: string, firstName: string) {
  const apiUrl = process.env.GHL_API_URL || "https://services.leadconnectorhq.com/contacts/";
  const apiToken = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  const apiVersion = process.env.GHL_API_VERSION || "2021-07-28";

  if (!apiToken || !locationId) {
    return { synced: false, reason: "GHL not configured" };
  }

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Version: apiVersion,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      locationId,
      email,
      firstName: firstName.slice(0, 50),
      source: "The Prompt Book",
      // The tag is the contract with the GHL workflow that sends the email.
      tags: ["prompt-book", "lead-magnet"],
    }),
  });

  if (res.ok) return { synced: true };

  const body = await res.text().catch(() => "");
  // A duplicate is a returning reader, not a failure.
  if (res.status === 400 && /duplicat/i.test(body)) return { synced: true, duplicate: true };
  return { synced: false, reason: `GHL ${res.status}`, detail: body.slice(0, 300) };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";

  if (!isEmail(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  let ghl: Awaited<ReturnType<typeof syncToGHL>> = { synced: false, reason: "not attempted" };
  try {
    ghl = await syncToGHL(email, firstName);
  } catch (e: any) {
    ghl = { synced: false, reason: e?.message || "sync threw" };
  }

  if (!ghl.synced) {
    // Logged for the operator; the reader still gets the book.
    console.error("[ebook-signup] GHL sync failed:", ghl.reason, (ghl as any).detail || "");
  }

  return res.status(200).json({ ok: true, download: PDF_URL, synced: ghl.synced });
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
