import { describe, it, expect } from "vitest";
import { buildInterimSongPrompt } from "./ai";

/**
 * THE STEP-0 GUARANTEE (SONGWRITING_ENGINE_PLAN.md): the user's story reaches the
 * writer WHOLE — every character, verbatim. The "Tears" disaster happened because
 * detailed stories were silently lost. This test fails the build if that ever
 * becomes possible again.
 */
describe("story integrity — the user's words arrive whole", () => {
  it("a long, detailed story appears verbatim in the writer prompt", () => {
    const story = [
      "My grandmother raised me in a two-bedroom apartment above her hair salon in Memphis.",
      "Every Sunday she'd press my shirt with the iron her mother left her, humming Sam Cooke.",
      "She passed in March. Last week I found her handwriting on a card inside my old Bible:",
      '"Be somebody nobody thought you could be." I want this song to feel like her kitchen —',
      "warm grease, gospel on the radio, and that iron hissing like it had something to say.",
      "Unique verification token: XK9-STORY-FIDELITY-7Q2.",
    ].join(" ");
    const prompt = buildInterimSongPrompt({ genre: "Gospel", creativeDirection: story, vocals: "Female Solo" });
    expect(prompt).toContain(story); // verbatim, not paraphrased, not truncated
    expect(prompt).toContain("XK9-STORY-FIDELITY-7Q2");
  });

  it("a 4,000-character story is not truncated by the prompt builder", () => {
    const story = ("The night shift at the bottling plant taught me everything. " ).repeat(70).trim();
    expect(story.length).toBeGreaterThan(4000);
    const prompt = buildInterimSongPrompt({ genre: "R&B", creativeDirection: story });
    expect(prompt).toContain(story);
  });

  it("genre and voice reach the prompt", () => {
    const prompt = buildInterimSongPrompt({ genre: "Hip-Hop", creativeDirection: "a story", vocals: "Male Solo" });
    expect(prompt).toContain("Hip-Hop");
    expect(prompt).toContain("male vocal");
  });

  it("no old-machinery fingerprints in the prompt (clean-break check)", () => {
    const prompt = buildInterimSongPrompt({ genre: "R&B", creativeDirection: "a story" });
    for (const fingerprint of [
      "GENRE CARD", "CRAFT BLUEPRINT", "authenticity", "WORD-BANK", "HOW R&B", "RULE #1",
      "cliché", "cliche", "YOUR PLAN", "GENRE TRUTH", "155",
    ]) {
      expect(prompt.toLowerCase()).not.toContain(fingerprint.toLowerCase());
    }
  });
});
