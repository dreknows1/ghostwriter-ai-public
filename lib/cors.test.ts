import { describe, it, expect } from "vitest";
import {
  CORS_ALLOWLIST,
  resolveAllowedOrigin,
  applyCors,
  handlePreflight,
  type CorsRequestLike,
  type CorsResponseLike,
} from "./cors";

function makeRes() {
  const headers: Record<string, string | number | readonly string[]> = {};
  let statusCode: number | null = null;
  let ended = false;
  const res: CorsResponseLike = {
    setHeader(name, value) {
      headers[name] = value;
      return undefined;
    },
    status(code) {
      statusCode = code;
      return {
        end() {
          ended = true;
          return undefined;
        },
      };
    },
  };
  return {
    res,
    headers,
    get statusCode() {
      return statusCode;
    },
    get ended() {
      return ended;
    },
  };
}

describe("resolveAllowedOrigin", () => {
  it("returns the exact origin for every allowlisted value", () => {
    for (const origin of CORS_ALLOWLIST) {
      expect(resolveAllowedOrigin(origin)).toBe(origin);
    }
  });

  it("includes the required native + web origins", () => {
    expect(CORS_ALLOWLIST).toContain("capacitor://localhost");
    expect(CORS_ALLOWLIST).toContain("https://www.songghost.com");
    expect(CORS_ALLOWLIST).toContain("https://songghost.com");
    expect(CORS_ALLOWLIST).toContain("https://ghostwriter-ai-public.vercel.app");
    expect(CORS_ALLOWLIST).toContain("http://localhost:5173");
  });

  it("rejects non-allowlisted origins (no wildcard, no partial match)", () => {
    expect(resolveAllowedOrigin("https://evil.com")).toBeNull();
    expect(resolveAllowedOrigin("https://www.songghost.com.evil.com")).toBeNull();
    expect(resolveAllowedOrigin("http://songghost.com")).toBeNull(); // wrong scheme
    expect(resolveAllowedOrigin("https://songghost.com/")).toBeNull(); // trailing slash
    expect(resolveAllowedOrigin("*")).toBeNull();
    expect(resolveAllowedOrigin(undefined)).toBeNull();
  });
});

describe("applyCors", () => {
  it("echoes only the matched origin and never a wildcard", () => {
    const t = makeRes();
    applyCors({ headers: { origin: "capacitor://localhost" } }, t.res);
    expect(t.headers["Access-Control-Allow-Origin"]).toBe("capacitor://localhost");
    expect(t.headers["Access-Control-Allow-Origin"]).not.toBe("*");
    expect(t.headers["Vary"]).toBe("Origin");
  });

  it("sets Vary: Origin but no Allow-Origin for a disallowed origin", () => {
    const t = makeRes();
    applyCors({ headers: { origin: "https://evil.com" } }, t.res);
    expect(t.headers["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(t.headers["Vary"]).toBe("Origin");
  });
});

describe("handlePreflight", () => {
  it("answers an OPTIONS preflight with 204 and returns true", () => {
    const t = makeRes();
    const req: CorsRequestLike = { method: "OPTIONS", headers: { origin: "https://songghost.com" } };
    const handled = handlePreflight(req, t.res);
    expect(handled).toBe(true);
    expect(t.statusCode).toBe(204);
    expect(t.ended).toBe(true);
    expect(t.headers["Access-Control-Allow-Origin"]).toBe("https://songghost.com");
    expect(t.headers["Access-Control-Allow-Methods"]).toContain("POST");
  });

  it("returns false for a non-OPTIONS request (caller continues)", () => {
    const t = makeRes();
    const req: CorsRequestLike = { method: "POST", headers: { origin: "https://songghost.com" } };
    expect(handlePreflight(req, t.res)).toBe(false);
    expect(t.statusCode).toBeNull();
  });
});
