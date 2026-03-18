const FREE_MONTHLY_CREDITS = 30;

export const COSTS = {
  GENERATE_SONG: 4,
  EDIT_SONG: 1,
  GENERATE_ART: 8,
  SOCIAL_PACK: 1,
  CREATE_AVATAR: 100,
};

async function callDb(action: string, payload: any) {
  const res = await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
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

export const deductCredits = async (email: string, amount: number = 1): Promise<number> => {
  try {
    const next = await callDb("spendCreditsByEmail", { email, amount, reason: "app_usage" });
    return Number(next ?? 0);
  } catch (e) {
    console.error("Credit deduction failed:", e);
    return await getUserCredits(email);
  }
};
