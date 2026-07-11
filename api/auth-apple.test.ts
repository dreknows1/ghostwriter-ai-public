import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { APPLE_ISSUER, APPLE_AUDIENCE } from "../lib/appleAuth";

// Mock Apple's JWKS + JWT verification so we can drive the decoded claims
// directly. createRemoteJWKSet runs at module load, so it must be mocked here.
const { mockJwtVerify } = vi.hoisted(() => ({ mockJwtVerify: vi.fn() }));
vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(() => ({})),
  jwtVerify: mockJwtVerify,
}));

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

import handler from "./auth-apple";

const SECRET = "apple-handler-test-secret-abcdef123456";
let ipCounter = 0;

function makeReq(body: any) {
  ipCounter += 1;
  return {
    method: "POST",
    headers: { "x-forwarded-for": `10.7.0.${ipCounter}`, origin: "capacitor://localhost" },
    body,
  } as any;
}

function makeRes() {
  const res: any = { statusCode: 0, jsonBody: undefined, headers: {} };
  res.setHeader = (k: string, v: any) => (res.headers[k] = v);
  res.status = (code: number) => {
    res.statusCode = code;
    return { json: (obj: any) => ((res.jsonBody = obj), res), end: () => res };
  };
  return res;
}

const futureExp = Math.floor(Date.now() / 1000) + 3600;

beforeAll(() => {
  process.env.AUTH_TOKEN_SECRET = SECRET;
  process.env.CONVEX_URL = "https://example.convex.cloud";
  process.env.CONVEX_ADMIN_KEY = "test-admin-key";
});

beforeEach(() => vi.clearAllMocks());

describe("POST /api/auth-apple — H2: bind to sub, never trust bodyEmail", () => {
  it("rejects a repeat sign-in (no email claim) with no stored sub mapping", async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { iss: APPLE_ISSUER, aud: APPLE_AUDIENCE, exp: futureExp, sub: "apple-sub-unknown", nonce: "n1" },
    });
    // No sub mapping and no email claim → upsertAppleUser resolves to null.
    mockMutation.mockResolvedValueOnce(null);

    const res = makeRes();
    // Attacker supplies a body email — it must be ignored entirely.
    await handler(makeReq({ identityToken: "tok", nonce: "n1", email: "attacker@evil.com" }), res);

    expect(res.statusCode).toBe(401);
    // The resolver was asked for the sub with NO email (bodyEmail never consulted).
    expect(mockMutation).toHaveBeenCalledTimes(1);
    const args = mockMutation.mock.calls[0][1];
    expect(args.sub).toBe("apple-sub-unknown");
    expect(args.email).toBeUndefined();
  });

  it("binds identity to the token email/sub, ignoring a mismatched body email", async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: {
        iss: APPLE_ISSUER,
        aud: APPLE_AUDIENCE,
        exp: futureExp,
        sub: "apple-sub-123",
        email: "real@icloud.com",
        nonce: "n1",
      },
    });
    mockMutation.mockResolvedValueOnce({ _id: "u1", email: "real@icloud.com" }); // upsertAppleUser
    mockQuery.mockResolvedValueOnce(false); // isSkoolMember

    const res = makeRes();
    await handler(makeReq({ identityToken: "tok", nonce: "n1", email: "attacker@evil.com" }), res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody?.session?.user?.email).toBe("real@icloud.com");
    expect(typeof res.jsonBody?.sessionToken).toBe("string");
    // Resolver received the TOKEN email, never the attacker body email.
    expect(mockMutation.mock.calls[0][1].email).toBe("real@icloud.com");
  });
});
