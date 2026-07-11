import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

// Mock the Convex client so we can assert whether — and with what args — a
// Convex call happens. The security-critical rejection path must NEVER reach it.
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

import handler from "./db";
import { mintSessionToken } from "../lib/authToken";

const SECRET = "db-handler-test-secret-abcdef123456";

function makeReq(body: any, headers: Record<string, string> = {}, method = "POST") {
  return {
    method,
    headers: { origin: "capacitor://localhost", ...headers },
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

beforeEach(() => vi.clearAllMocks());

describe("POST /api/db — session enforcement (AC1)", () => {
  it("rejects with 401 and makes NO Convex call when no bearer token is present", async () => {
    const res = makeRes();
    await handler(makeReq({ action: "getSongsByEmail", payload: { email: "victim@example.com" } }), res);
    expect(res.statusCode).toBe(401);
    expect(res.headers["X-Session-Invalid"]).toBe("1");
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockMutation).not.toHaveBeenCalled();
  });

  it("rejects a tampered/invalid bearer token with 401, no Convex call", async () => {
    const res = makeRes();
    await handler(
      makeReq(
        { action: "getSongsByEmail", payload: { email: "victim@example.com" } },
        { authorization: "Bearer not.a.real.token" }
      ),
      res
    );
    expect(res.statusCode).toBe(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("POST /api/db — identity is the token, not the payload (AC2)", () => {
  it("IGNORES a payload email for a different user and acts as the token's email", async () => {
    mockQuery.mockResolvedValueOnce([{ id: "song_1" }]);
    const token = mintSessionToken({ email: "owner@example.com", secret: SECRET });
    const res = makeRes();
    // Attacker token (owner@) tries to read victim@'s songs via the payload email.
    await handler(
      makeReq(
        { action: "getSongsByEmail", payload: { email: "victim@example.com" } },
        { authorization: `Bearer ${token}` }
      ),
      res
    );
    expect(res.statusCode).toBe(200);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    // The email passed to Convex is the TOKEN's email — the victim email was dropped.
    const passedArgs = mockQuery.mock.calls[0][1];
    expect(passedArgs.email).toBe("owner@example.com");
  });

  it("forces the token email onto deleteSongById so it cannot delete another user's song", async () => {
    mockMutation.mockResolvedValueOnce({ ok: true });
    const token = mintSessionToken({ email: "owner@example.com", secret: SECRET });
    const res = makeRes();
    await handler(
      makeReq(
        { action: "deleteSongById", payload: { songId: "abc", email: "victim@example.com" } },
        { authorization: `Bearer ${token}` }
      ),
      res
    );
    expect(res.statusCode).toBe(200);
    const passedArgs = mockMutation.mock.calls[0][1];
    expect(passedArgs.email).toBe("owner@example.com");
    expect(passedArgs.songId).toBe("abc");
  });

  it("no longer exposes setProfileTier as a client action", async () => {
    const token = mintSessionToken({ email: "owner@example.com", secret: SECRET });
    const res = makeRes();
    await handler(
      makeReq({ action: "setProfileTier", payload: { tier: "skool" } }, { authorization: `Bearer ${token}` }),
      res
    );
    expect(res.statusCode).toBe(400); // unknown action
    expect(mockMutation).not.toHaveBeenCalled();
  });
});
