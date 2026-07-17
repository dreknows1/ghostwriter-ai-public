export const CREDITS_PUBLIC = 25;
export const CREDITS_SKOOL = 100;

// Server-authoritative cost of creating an avatar. MUST match
// services/creditService.ts COSTS.CREATE_AVATAR — the charge is now enforced in
// the profile upsert mutation, not by a (removed) client-side deduct.
export const CREATE_AVATAR_COST = 100;

// Owner accounts get unlimited credits: never charged, never reset down.
// The credit balance is pinned to UNLIMITED_CREDITS and spends are no-ops.
export const UNLIMITED_CREDITS = 9_999_999;

// Emails granted owner (unlimited) status. Add more here as needed.
export const OWNER_EMAILS = ["dreblogz@gmail.com"];

export function isOwnerEmail(email?: string | null): boolean {
  const e = String(email || "").trim().toLowerCase();
  return OWNER_EMAILS.some((o) => o.trim().toLowerCase() === e);
}
