import { describe, it, expect, beforeEach, vi } from "vitest";
import { mintSessionToken } from "../lib/authToken";

const SECRET = "test-secret-please-ignore-0123456789abcdef";

// Mock the Convex HTTP client so no real Convex call happens and we can assert
// exactly whether — and with what arguments — the handlers forwarded a call.
const h = vi.hoisted(() => ({
  ctorCalls: [] as string[],
  queryCalls: [] as Array<{ ref: unknown; args: any }>,
  mutationCalls: [] as Array<{ ref: unknown; args: any }>,
  queryImpl: (_ref: unknown, _args: any): any => undefined,
  mutationImpl: (_ref: unknown, _args: any): any => undefined,
}));

vi.mock("convex/browser", () => ({
  ConvexHttpClient: class {
    constructor(url: string) {
      h.ctorCalls.push(url);
    }
    setAdminAuth(_k: string) {}
    query(ref: unknown, args: any) {
      h.queryCalls.push({ ref, args });
      return h.queryImpl(ref, args);
    }
    mutation(ref: unknown, args: any) {
      h.mutationCalls.push({ ref, args });
      return h.mutationImpl(ref, args);
    }
  },
}));

// Import handlers AFTER the mock is registered (vi.mock is hoisted above these).
import dbHandler from "../server/db";
import authHandler from "../server/auth";

function makeRes() {
  const res: any = { statusCode: 0, headers: {} as Record<string, any>, body: undefined, ended: false };
  res.setHeader = (k: string, v: any) => {
    res.headers[String(k).toLowerCase()] = v;
    return res;
  };
  res.status = (c: number) => {
    res.statusCode = c;
    return res;
  };
  res.json = (o: any) => {
    res.body = o;
    return res;
  };
  res.end = () => {
    res.ended = true;
    return res;
  };
  return res;
}

function makeReq(opts: { method?: string; headers?: Record<string, any>; body?: any }) {
  return { method: opts.method ?? "POST", headers: opts.headers ?? {}, body: opts.body ?? {} } as any;
}

function bearerFor(email: string) {
  return { authorization: `Bearer ${mintSessionToken({ email, secret: SECRET })}` };
}

beforeEach(() => {
  h.ctorCalls.length = 0;
  h.queryCalls.length = 0;
  h.mutationCalls.length = 0;
  h.queryImpl = () => undefined;
  h.mutationImpl = () => undefined;
  process.env.AUTH_TOKEN_SECRET = SECRET;
  process.env.CONVEX_URL = "https://example.convex.cloud";
  process.env.CONVEX_ADMIN_KEY = "admin-key";
});

describe("C1 — gated endpoints reject requests without a valid session bearer", () => {
  it("/api/db → 401 + X-Session-Invalid, and never touches Convex", async () => {
    const res = makeRes();
    await dbHandler(makeReq({ body: { action: "getSongsByEmail", payload: { email: "victim@x.com" } } }), res);
    expect(res.statusCode).toBe(401);
    expect(res.headers["x-session-invalid"]).toBe("1");
    expect(h.ctorCalls.length).toBe(0);
    expect(h.queryCalls.length).toBe(0);
    expect(h.mutationCalls.length).toBe(0);
  });

  it('/api/auth action:"db" → 401, and never touches Convex', async () => {
    const res = makeRes();
    await authHandler(
      makeReq({ body: { action: "db", dbAction: "getSongsByEmail", payload: { email: "victim@x.com" } } }),
      res
    );
    expect(res.statusCode).toBe(401);
    expect(res.headers["x-session-invalid"]).toBe("1");
    expect(h.ctorCalls.length).toBe(0);
  });

  it("/api/ai (POST) → 401, and never touches Convex", async () => {
    const aiHandler = (await import("../server/ai")).default;
    const res = makeRes();
    await aiHandler(
      makeReq({ method: "POST", body: { action: "generateSong", email: "victim@x.com", payload: {} } }),
      res
    );
    expect(res.statusCode).toBe(401);
    expect(res.headers["x-session-invalid"]).toBe("1");
    expect(h.ctorCalls.length).toBe(0);
  });

  it("rejects a syntactically invalid bearer too", async () => {
    const res = makeRes();
    await dbHandler(
      makeReq({ headers: { authorization: "Bearer not.a.real.token" }, body: { action: "getSongsByEmail", payload: {} } }),
      res
    );
    expect(res.statusCode).toBe(401);
    expect(h.ctorCalls.length).toBe(0);
  });
});

describe("C1 — the acting email is forced to the token, ignoring any payload email", () => {
  it("/api/db forwards the TOKEN email, not the caller-supplied payload email", async () => {
    h.queryImpl = () => [];
    const res = makeRes();
    await dbHandler(
      makeReq({
        headers: bearerFor("alice@example.com"),
        body: { action: "getSongsByEmail", payload: { email: "bob@victim.com" } },
      }),
      res
    );
    expect(res.statusCode).toBe(200);
    expect(h.queryCalls.length).toBe(1);
    expect(h.queryCalls[0].args.email).toBe("alice@example.com");
  });

  it('/api/auth action:"db" forwards the TOKEN email, not the payload email', async () => {
    h.queryImpl = () => [];
    const res = makeRes();
    await authHandler(
      makeReq({
        headers: bearerFor("alice@example.com"),
        body: { action: "db", dbAction: "getSongsByEmail", payload: { email: "bob@victim.com" } },
      }),
      res
    );
    expect(res.statusCode).toBe(200);
    expect(h.queryCalls.length).toBe(1);
    expect(h.queryCalls[0].args.email).toBe("alice@example.com");
  });
});

describe("C2 — setProfileTier is not reachable through the client proxies", () => {
  it("/api/db rejects action setProfileTier with 400 and no Convex call", async () => {
    const res = makeRes();
    await dbHandler(
      makeReq({ headers: bearerFor("alice@example.com"), body: { action: "setProfileTier", payload: { tier: "skool" } } }),
      res
    );
    expect(res.statusCode).toBe(400);
    expect(h.ctorCalls.length).toBe(0);
    expect(h.mutationCalls.length).toBe(0);
  });

  it('/api/auth action:"db" rejects dbAction setProfileTier with 400 and no Convex call', async () => {
    const res = makeRes();
    await authHandler(
      makeReq({
        headers: bearerFor("alice@example.com"),
        body: { action: "db", dbAction: "setProfileTier", payload: { tier: "skool" } },
      }),
      res
    );
    expect(res.statusCode).toBe(400);
    expect(h.ctorCalls.length).toBe(0);
    expect(h.mutationCalls.length).toBe(0);
  });
});

describe("H1 — signup cannot attach a password to an existing account", () => {
  it("returns 409 and never calls a credential mutation when the account already exists", async () => {
    // getUserByEmail returns an existing (even passwordless) user.
    h.queryImpl = (_ref, args) => ({ _id: "user_existing", email: args.email });
    const res = makeRes();
    await authHandler(
      makeReq({ body: { action: "signup", email: "existing@example.com", password: "hunter2hunter2" } }),
      res
    );
    expect(res.statusCode).toBe(409);
    expect(h.mutationCalls.length).toBe(0); // no upsertUserCredentials → no takeover
  });
});

describe("oauth hole — a bare-email oauth mint is rejected", () => {
  it('POST {action:"oauth", email} with no signed token → 401, no session minted', async () => {
    const res = makeRes();
    await authHandler(makeReq({ body: { action: "oauth", email: "victim@x.com" } }), res);
    expect(res.statusCode).toBe(401);
    expect(res.body?.sessionToken).toBeUndefined();
  });
});
