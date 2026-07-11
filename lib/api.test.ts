import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// lib/platform.ts wraps @capacitor/core's Capacitor.isNativePlatform(); mock it
// directly so these tests don't need a real Capacitor native runtime.
vi.mock("./platform", () => ({
  isNative: vi.fn(),
}));

import { isNative } from "./platform";
import { apiUrl } from "./api";

const mockIsNative = vi.mocked(isNative);

describe("apiUrl", () => {
  const originalBase = import.meta.env.VITE_API_BASE;

  afterEach(() => {
    // Note: assigning `undefined` directly here would coerce to the string
    // "undefined" under vitest's process.env-backed import.meta.env — always
    // `delete` to truly unset, only reassigning when there was a real value.
    if (originalBase === undefined) {
      delete import.meta.env.VITE_API_BASE;
    } else {
      import.meta.env.VITE_API_BASE = originalBase;
    }
    vi.clearAllMocks();
  });

  describe("web (isNative() === false)", () => {
    beforeEach(() => {
      mockIsNative.mockReturnValue(false);
    });

    it("is a pure passthrough — apiUrl(path) === path", () => {
      expect(apiUrl("/api/auth")).toBe("/api/auth");
      expect(apiUrl("/api/ai")).toBe("/api/ai");
      expect(apiUrl("/api/checkout-complete")).toBe("/api/checkout-complete");
    });

    it("ignores VITE_API_BASE on web", () => {
      import.meta.env.VITE_API_BASE = "https://custom.example.com";
      expect(apiUrl("/api/db")).toBe("/api/db");
    });
  });

  describe("native (isNative() === true)", () => {
    beforeEach(() => {
      mockIsNative.mockReturnValue(true);
    });

    it("prefixes the default production origin when VITE_API_BASE is unset", () => {
      delete import.meta.env.VITE_API_BASE;
      expect(apiUrl("/api/auth")).toBe("https://www.songghost.com/api/auth");
    });

    it("prefixes a custom VITE_API_BASE when set", () => {
      import.meta.env.VITE_API_BASE = "https://staging.songghost.com";
      expect(apiUrl("/api/auth")).toBe("https://staging.songghost.com/api/auth");
    });

    it("trims a trailing slash on the base before joining", () => {
      import.meta.env.VITE_API_BASE = "https://staging.songghost.com/";
      expect(apiUrl("/api/auth")).toBe("https://staging.songghost.com/api/auth");
    });

    it("adds a leading slash to the path if missing", () => {
      import.meta.env.VITE_API_BASE = "https://staging.songghost.com";
      expect(apiUrl("api/auth")).toBe("https://staging.songghost.com/api/auth");
    });
  });
});
