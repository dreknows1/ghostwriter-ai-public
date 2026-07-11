import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

// Mock the Convex client so the handler's success path can run without a live
// backend. Rejection paths (the security-critical ones) never reach Convex.
const { mockQuery, mockMutation, mockSetAdminAuth } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
  mockMutation: vi.fn(),
  mockSetAdminAuth: vi.fn(),
}));

vi.mock("convex/browser", () => ({
  ConvexHttpClient: vi.fn(() => ({
    setAdminAuth: mockSetAdminAuth,
    query: mockQuery,
    mutation: mockMutation,
  })),
}));

import handler from "./auth";
import { mintToken, mintSessionToken, OAUTH_SESSION_PURPOSE, __resetConsumedNonces } from "../lib/authToken";

const SECRET = "auth-handler-test-secret-abcdef123456";

let ipCounter = 0;
function makeReq(body: any, method = "POST") {
  ipCounter += 1;
  return {
    method,
    // Unique IP per request so the in-memory rate limiter never couples tests.
    headers: { "x-forwarded-for": `10.0.0.${ipCounter}`, origin: "capacitor://localhost" },
    body,
  } as any;
}

function makeRes() {
  const res: any = { statusCode: 0, jsonBody: undefined, headers: {} };
  res.setHeader = (k: string, v: any) => {
    res.headers[k] = v;
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return {
      json: (obj: any) => {
        res.jsonBody = obj;
        return res;
      },
      end: () => res,
    };
  };
  return res;
}

beforeAll(() => {
  process.env.AUTH_TOKEN_SECRET = SECRET;
  process.env.CONVEX_URL = "https://example.convex.cloud";
  process.env.CONVEX_ADMIN_KEY = "test-admin-key";
});

beforeEach(() => {
  vi.clearAllMocks();
  __resetConsumedNonces();
});

describe("POST /api/auth action:oauth — the closed account-takeover hole", () => {
  it("REJECTS a bare {action:'oauth', email} with no token (AC1)", async () => {
    const res = makeRes();
    await handler(makeReq({ action: "oauth", email: "victim@example.com" }), res);
    expect(res.statusCode).toBe(401);
    // Crucially, no Convex work happened — the email was never trusted.
    expect(mockMutation).not.toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("rejects a tampered token", async () => {
    const token = mintToken({ email: "victim@example.com", secret: SECRET });
    const [b64, sig] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({
        email: "attacker@example.com",
        nonce: "x",
        exp: Date.now() + 60_000,
        purpose: OAUTH_SESSION_PURPOSE,
      })
    ).toString("base64url");
    const res = makeRes();
    await handler(makeReq({ action: "oauth", token: `${forgedPayload}.${sig}` }), res);
    expect(res.statusCode).toBe(401);
    expect(mockMutation).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    const token = mintToken({ email: "a@b.com", secret: SECRET, now: 1000, ttlMs: 1000 });
    const res = makeRes();
    await handler(makeReq({ action: "oauth", token }), res);
    expect(res.statusCode).toBe(401);
    expect(mockMutation).not.toHaveBeenCalled();
  });

  it("rejects a token signed with the wrong secret", async () => {
    const token = mintToken({ email: "a@b.com", secret: "not-the-real-secret" });
    const res = makeRes();
    await handler(makeReq({ action: "oauth", token }), res);
    expect(res.statusCode).toBe(401);
    expect(mockMutation).not.toHaveBeenCalled();
  });

  it("mints a session for a valid token, deriving the email FROM the token", async () => {
    // consume -> firstUse; getUserByEmail -> null (net new); upsert -> user; isSkoolMember -> false
    mockMutation.mockResolvedValueOnce({ firstUse: true }).mockResolvedValueOnce({
      _id: "user_1",
      email: "person@example.com",
    });
    mockQuery.mockResolvedValueOnce(null).mockResolvedValueOnce(false);

    const token = mintToken({ email: "person@example.com", secret: SECRET });
    const res = makeRes();
    // Attacker-style extra body field must be ignored; identity comes from token.
    await handler(makeReq({ action: "oauth", token, email: "attacker@evil.com" }), res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody?.session?.user?.email).toBe("person@example.com");
  });

  it("rejects a replayed (already-consumed) token on the second presentation", async () => {
    mockMutation.mockResolvedValueOnce({ firstUse: true }).mockResolvedValueOnce({
      _id: "user_1",
      email: "person@example.com",
    });
    mockQuery.mockResolvedValueOnce(null).mockResolvedValueOnce(false);

    const token = mintToken({ email: "person@example.com", secret: SECRET, nonce: "replay-nonce" });

    const res1 = makeRes();
    await handler(makeReq({ action: "oauth", token }), res1);
    expect(res1.statusCode).toBe(200);

    // Same token again — the in-process guard rejects before any Convex call.
    const res2 = makeRes();
    await handler(makeReq({ action: "oauth", token }), res2);
    expect(res2.statusCode).toBe(401);
  });

  it("returns 405 for non-POST", async () => {
    const res = makeRes();
    await handler(makeReq({ action: "oauth" }, "GET"), res);
    expect(res.statusCode).toBe(405);
  });
});

function makeAuthedReq(body: any, headers: Record<string, string> = {}) {
  ipCounter += 1;
  return {
    method: "POST",
    headers: { "x-forwarded-for": `10.9.0.${ipCounter}`, origin: "capacitor://localhost", ...headers },
    body,
  } as any;
}

describe("POST /api/auth action:db — session enforcement", () => {
  it("rejects a db call with no bearer token (401, no Convex call)", async () => {
    const res = makeRes();
    await handler(
      makeAuthedReq({ action: "db", dbAction: "getSongsByEmail", payload: { email: "victim@example.com" } }),
      res
    );
    expect(res.statusCode).toBe(401);
    expect(res.headers["X-Session-Invalid"]).toBe("1");
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockMutation).not.toHaveBeenCalled();
  });

  it("with a valid token, forces the token email onto the payload (ignores caller email)", async () => {
    mockQuery.mockResolvedValueOnce([{ id: "song_1" }]);
    const token = mintSessionToken({ email: "owner@example.com", secret: SECRET });
    const res = makeRes();
    await handler(
      makeAuthedReq(
        { action: "db", dbAction: "getSongsByEmail", payload: { email: "victim@example.com" } },
        { authorization: `Bearer ${token}` }
      ),
      res
    );
    expect(res.statusCode).toBe(200);
    expect(mockQuery.mock.calls[0][1].email).toBe("owner@example.com");
  });
});

describe("POST /api/auth action:signup — H1 (no takeover of an existing account)", () => {
  it("rejects signup against ANY existing account with 409 and never sets a password", async () => {
    // getUserByEmail returns an existing (passwordless) account.
    mockQuery.mockResolvedValueOnce({ _id: "user_existing", email: "taken@example.com" });
    const res = makeRes();
    await handler(
      makeAuthedReq({ action: "signup", email: "taken@example.com", password: "supersecret123" }),
      res
    );
    expect(res.statusCode).toBe(409);
    // Crucially, upsertUserCredentials (which would attach the password) never ran.
    expect(mockMutation).not.toHaveBeenCalled();
  });
});
