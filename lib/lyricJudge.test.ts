import { describe, it, expect } from "vitest";
import {
  buildJudgePrompt,
  validateRewrite,
  isJudgePass,
  JUDGE_PASS_TOKEN,
} from "./lyricJudge";

const SONG = `Title: Gravel Lot
### SUNO Prompt
A slow country ballad with pedal steel.
### Lyrics
[Verse 1]
She keeps his ring in the ashtray
Coffee going cold in the cupholder
[Chorus]
Screen door slaps the frame
Boots by the back door
[Outro]
Gravel crunch fading out`;

describe("buildJudgePrompt", () => {
  it("includes genre, language, clichés, ethos, and the song", () => {
    const p = buildJudgePrompt(SONG, {
      genreName: "Country",
      subGenre: "Americana",
      language: "English",
      cliches: ["Cold beer on a Friday night"],
      ethos: "Let a real object carry the feeling.",
      lexiconSample: ["tailgate", "gravel lot"],
    });
    expect(p).toContain("Americana Country");
    expect(p).toContain("native English speaker");
    expect(p).toContain("Cold beer on a Friday night");
    expect(p).toContain("Let a real object carry the feeling.");
    expect(p).toContain("tailgate");
    expect(p).toContain("Gravel Lot");
    expect(p).toContain(JUDGE_PASS_TOKEN);
  });

  it("omits optional blocks cleanly when absent", () => {
    const p = buildJudgePrompt(SONG, {
      genreName: "Pop",
      language: "English",
      cliches: [],
    });
    expect(p).toContain("Pop lyric editor");
    expect(p).not.toContain("TIRED TROPES");
    expect(p).not.toContain("CRAFT STANDARD");
    expect(p).not.toContain("CALIBRATION");
  });
});

describe("isJudgePass", () => {
  it("recognizes the pass token", () => {
    expect(isJudgePass(JUDGE_PASS_TOKEN)).toBe(true);
    expect(isJudgePass(`  ${JUDGE_PASS_TOKEN}\n`)).toBe(true);
    expect(isJudgePass("Title: something")).toBe(false);
    expect(isJudgePass("")).toBe(false);
  });
});

describe("validateRewrite", () => {
  it("accepts a faithful rewrite (same structure, similar length)", () => {
    const rewrite = SONG.replace("Coffee going cold", "Diner coffee skinned over");
    expect(validateRewrite(SONG, rewrite).ok).toBe(true);
  });

  it("rejects empty output and the pass token", () => {
    expect(validateRewrite(SONG, "").ok).toBe(false);
    expect(validateRewrite(SONG, JUDGE_PASS_TOKEN).ok).toBe(false);
  });

  it("rejects output missing required sections", () => {
    expect(validateRewrite(SONG, "just some lyrics with no format").ok).toBe(false);
    expect(validateRewrite(SONG, "Title: X\n### Lyrics\n[Verse]\nhello").ok).toBe(false); // no SUNO section
  });

  it("rejects rewrites that drop section tags", () => {
    const gutted = `Title: Gravel Lot
### SUNO Prompt
A slow country ballad with pedal steel.
### Lyrics
just one line, all structure gone`;
    const v = validateRewrite(SONG, gutted);
    expect(v.ok).toBe(false);
    expect(v.reason).toContain("section-tags");
  });

  it("rejects rewrites that balloon or shrink the lyrics drastically", () => {
    const bloated = SONG + "\n" + "an extra line of padding\n".repeat(40);
    const v = validateRewrite(SONG, bloated);
    expect(v.ok).toBe(false);
    expect(v.reason).toContain("length-ratio");
  });
});
