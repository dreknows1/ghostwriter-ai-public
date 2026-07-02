import { describe, it, expect } from "vitest";
import {
  ALL_GUIDES,
  getGuideById,
  getGuidesByLanguage,
  getAllGenreIds,
  getAllLanguages,
  resolveSubGenreGuide,
} from "./index";

describe("guide lookup", () => {
  it("has 25 guides with unique ids", () => {
    expect(ALL_GUIDES.length).toBe(25);
    const ids = ALL_GUIDES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getGuideById finds known genres and returns undefined for unknown", () => {
    expect(getGuideById("hip-hop")?.name).toBeTruthy();
    expect(getGuideById("country")?.id).toBe("country");
    expect(getGuideById("not-a-genre")).toBeUndefined();
  });

  it("getGuidesByLanguage is case-insensitive and non-empty for English", () => {
    const en = getGuidesByLanguage("English");
    expect(en.length).toBeGreaterThan(0);
    expect(getGuidesByLanguage("english").length).toBe(en.length);
  });

  it("getAllGenreIds / getAllLanguages are consistent", () => {
    expect(getAllGenreIds().length).toBe(ALL_GUIDES.length);
    expect(getAllLanguages().length).toBeGreaterThan(0);
    expect(getAllLanguages()).toContain("English");
  });
});

describe("resolveSubGenreGuide", () => {
  it("returns the guide unchanged for an empty sub-genre", () => {
    const guide = getGuideById("hip-hop")!;
    expect(resolveSubGenreGuide(guide, "")).toBe(guide);
  });

  it("does not throw and returns a guide object for any sub-genre string", () => {
    const guide = getGuideById("pop")!;
    const resolved = resolveSubGenreGuide(guide, "synth-pop");
    expect(resolved).toBeTruthy();
    expect(resolved.id).toBe("pop");
  });
});

// Data-integrity: the guide *content* is what makes output genre-authentic. A malformed
// or empty guide silently degrades quality, so assert every guide carries real knowledge.
describe("guide data integrity", () => {
  for (const guide of ALL_GUIDES) {
    describe(guide.id, () => {
      it("has core identity fields", () => {
        expect(guide.id).toBeTruthy();
        expect(guide.name).toBeTruthy();
        expect(guide.language).toBeTruthy();
      });

      it("has a non-empty genre-specific cliché ban list", () => {
        expect(Array.isArray(guide.lyricalConventions?.cliches)).toBe(true);
        expect(guide.lyricalConventions.cliches.length).toBeGreaterThan(0);
      });

      it("has lyrical + groove + structure dimensions populated", () => {
        expect(guide.lyricalConventions?.perspective).toBeTruthy();
        expect(guide.rhythmAndGroove?.grooveArchetype).toBeTruthy();
        expect(Array.isArray(guide.songStructure?.sections)).toBe(true);
        expect(guide.songStructure.sections.length).toBeGreaterThan(0);
      });

      it("has at least one sub-genre with a name", () => {
        expect(Array.isArray(guide.subGenres)).toBe(true);
        expect(guide.subGenres.length).toBeGreaterThan(0);
        expect(guide.subGenres.every((s) => !!s.name)).toBe(true);
      });
    });
  }
});
