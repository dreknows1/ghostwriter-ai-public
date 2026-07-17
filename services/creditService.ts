import { apiFetch } from "../lib/api";

const FREE_MONTHLY_CREDITS = 25;

export const COSTS = {
  GENERATE_SONG: 10,
  EDIT_SONG: 1,
  GENERATE_ART: 8,
  SOCIAL_PACK: 1,
  CREATE_AVATAR: 100,
};

// Owner accounts carry a very large sentinel balance — show it as "∞" not "9999999".
export const formatCredits = (n: number | null | undefined): string =>
  typeof n === "number" && n >= 1_000_000 ? "∞" : String(n ?? 0);

async function callDb(action: string, payload: any) {
  const res = await apiFetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "db", dbAction: action, payload }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "DB call failed");
  return json.data;
}

export const getUserCredits = async (email: string): Promise<number> => {
  try {
    const credits = await callDb("getCreditsByEmail", { email });
    return Number(credits ?? FREE_MONTHLY_CREDITS);
  } catch (e) {
    console.error("Failed to fetch credits:", e);
    return 0;
  }
};

export const hasEnoughCredits = async (email: string, cost: number = 1): Promise<boolean> => {
  const credits = await getUserCredits(email);
  return credits >= cost;
};

// Affordability check that distinguishes a real "out of credits" from a network
// failure. getUserCredits() returns 0 on any error, which would falsely route an
// offline user to the paywall — this reports `offline` instead so the caller can
// show a connection message and NOT open Pricing.
export type AffordCheck = { ok: boolean; reason: 'ok' | 'insufficient' | 'offline'; credits: number | null };
export const checkAffordability = async (email: string, cost: number): Promise<AffordCheck> => {
  try {
    const raw = await callDb("getCreditsByEmail", { email });
    const credits = Number(raw ?? FREE_MONTHLY_CREDITS);
    const ok = credits >= cost;
    return { ok, reason: ok ? 'ok' : 'insufficient', credits };
  } catch (e) {
    console.error("Affordability check failed (offline?):", e);
    return { ok: false, reason: 'offline', credits: null };
  }
};

export const deductCredits = async (email: string, amount: number = 1, reason: string = "app_usage"): Promise<number> => {
  try {
    const next = await callDb("spendCreditsByEmail", { email, amount, reason });
    return Number(next ?? 0);
  } catch (e) {
    console.error("Credit deduction failed:", e);
    return await getUserCredits(email);
  }
};
