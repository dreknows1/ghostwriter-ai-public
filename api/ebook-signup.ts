import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Lead capture and delivery for The Prompt Book.
 *
 * Creates the contact in GoHighLevel and then sends the delivery email through
 * GHL's Conversations API, using the credentials the app already holds
 * (GHL_API_TOKEN / GHL_LOCATION_ID).
 *
 * Sending directly rather than via a GHL workflow is deliberate: it is one
 * fewer moving part, it delivers immediately instead of on a workflow tick,
 * and it can be tested end to end. The `prompt-book` tag is still applied, so
 * any workflow added later can pick these contacts up.
 *
 * The download never depends on any of this succeeding — the thank-you page
 * links the PDF directly, so a CRM or mail hiccup cannot cost someone the
 * thing they asked for.
 */

const PDF_URL = "https://songghost.com/the-prompt-book.pdf";
const BASE = "https://services.leadconnectorhq.com";
const VERSION = process.env.GHL_API_VERSION || "2021-07-28";

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) && v.length < 254;
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Version: VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/** Create the contact, or recover its id if GHL says it already exists. */
async function upsertContact(token: string, locationId: string, email: string, firstName: string) {
  const res = await fetch(`${BASE}/contacts/`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      locationId,
      email,
      firstName: firstName.slice(0, 50),
      source: "The Prompt Book",
      tags: ["prompt-book", "lead-magnet"],
    }),
  });

  const text = await res.text().catch(() => "");
  let json: any = {};
  try { json = JSON.parse(text); } catch { /* non-JSON body */ }

  if (res.ok) {
    return { ok: true, contactId: json?.contact?.id || json?.id, created: true };
  }
  // A returning reader is not a failure — GHL hands back the existing id.
  const existing = json?.meta?.contactId;
  if (existing) return { ok: true, contactId: existing, created: false };

  return { ok: false, reason: `contacts ${res.status}`, detail: text.slice(0, 300) };
}

const emailHtml = (firstName: string) => `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#1a1a1a">
  <p>Hey${firstName ? " " + escapeHtml(firstName) : ""},</p>
  <p>Here it is — <strong>The Prompt Book</strong>.</p>
  <p><a href="${PDF_URL}" style="display:inline-block;background:#2b5be0;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700">Download the book</a></p>
  <p>Or paste this into your browser:<br><a href="${PDF_URL}">${PDF_URL}</a></p>
  <p>Read the first four chapters once. They are short, and they are the part
  that actually changes your songs. Then flip to your genre and steal the recipe.</p>
  <p>If you get stuck, post the song in the Music Review group and ask what is not landing:<br>
  <a href="https://www.facebook.com/groups/1059552496761019">The Music Review group</a></p>
  <p>Go write one tonight — <a href="https://songghost.com">songghost.com</a></p>
  <p>— Rudy</p>
</div>`.trim();

const emailText = (firstName: string) =>
  `Hey${firstName ? " " + firstName : ""},

Here it is - The Prompt Book.

Download it here: ${PDF_URL}

Read the first four chapters once. They are short, and they are the part that
actually changes your songs. Then flip to your genre and steal the recipe.

If you get stuck, post the song in the Music Review group and ask what is not
landing: https://www.facebook.com/groups/1059552496761019

Go write one tonight - https://songghost.com

- Rudy`;

async function sendEmail(token: string, contactId: string, firstName: string) {
  const res = await fetch(`${BASE}/conversations/messages`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      type: "Email",
      contactId,
      subject: "Here's your Prompt Book",
      html: emailHtml(firstName),
      emailTo: undefined, // GHL resolves the address from the contact
      message: emailText(firstName),
    }),
  });
  if (res.ok) return { sent: true };
  const detail = await res.text().catch(() => "");
  return { sent: false, reason: `messages ${res.status}`, detail: detail.slice(0, 300) };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
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

  const token = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  // Sending mail needs the conversations/message.write scope, which the app's
  // contacts token does not carry. Keep them separate so adding the ability to
  // send can never put the app's signup sync at risk.
  const mailToken = process.env.GHL_MESSAGE_TOKEN || token;
  const debug = req.query?.debug === "1";

  let synced = false;
  let sent = false;
  let diag: Record<string, unknown> = {};

  if (token && locationId) {
    try {
      const contact = await upsertContact(token, locationId, email, firstName);
      synced = contact.ok;
      diag.contact = contact.ok ? { id: contact.contactId, created: contact.created } : contact;

      if (contact.ok && contact.contactId) {
        const mail = await sendEmail(mailToken!, contact.contactId, firstName);
        sent = mail.sent;
        diag.email = mail;
      }
    } catch (e: any) {
      diag.error = e?.message || String(e);
    }
  } else {
    diag.config = "GHL_API_TOKEN or GHL_LOCATION_ID missing";
  }

  if (!synced || !sent) console.error("[ebook-signup]", JSON.stringify(diag));

  return res.status(200).json({
    ok: true,
    download: PDF_URL,
    synced,
    sent,
    ...(debug ? { diag } : {}),
  });
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
