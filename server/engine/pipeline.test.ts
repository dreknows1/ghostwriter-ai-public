import { describe, it, expect } from "vitest";
import type { CompiledCurriculum, RoomCard } from "./types";
import {
  EngineFailure,
  parseFirstJson,
  resolveGenre,
  runEngine,
  scoreHook,
  storyTokens,
  type EngineGenerate,
} from "./pipeline";

// Synthetic curriculum — plainly fake craft text; the real one is generated from the
// curriculum documents. Only the SHAPE matters to the pipeline.
const room = (id: string, name: string): RoomCard => ({
  id,
  name,
  oneLine: `The ${name} room for testing.`,
  tempoGroove: "80-100 BPM, straight groove, moderate word density.",
  writingDials: ["dial one for testing", "dial two for testing", "dial three", "dial four"],
  rendering: "Test keys over test drums with a close test vocal.",
  storyFit: "Testing stories.",
  parodyTraps: "Sounding like a test.",
});

const CURRICULUM_FIXTURE: CompiledCurriculum = {
  core: "Core craft text for testing. A song is a felt emotion delivered through structure.",
  genres: {
    rnb: {
      id: "rnb",
      name: "R&B",
      aliases: ["r&b", "rnb", "r and b"],
      profileText: "Genre profile text for testing.",
      defaultRoomId: "contemporary-rnb",
      rooms: [room("contemporary-rnb", "Contemporary R&B"), room("quiet-storm", "Quiet Storm")],
      cues: [
        { cue: "anniversary", strength: "strong", roomId: "quiet-storm" },
        { cue: "situationship", strength: "strong", roomId: "contemporary-rnb" },
      ],
    },
  },
  hash: "abc123def456",
  approxTokens: { core: 20, largestSlice: 60 },
};

const STORY =
  "Our anniversary is next month. She kept the receipt from our first dinner at the pancake diner on Fulton Street, laminated it, and hid it inside her wallet for nine years.";

// A draft the real checkers accept: correct format, hook in the first chorus,
// identical choruses, story details present, 40-70 word SUNO prompt.
function goodDraft(hook: string): string {
  const suno =
    "Warm test keys over soft test drums, close female vocal, gentle bass and light background harmony throughout the whole track, " +
    "with air between elements, subtle percussion details, a calm intimate mood from start to finish, and a soft fade ending on the final chorus repeat.";
  return `Title: ${hook}
### SUNO Prompt
${suno}
### Lyrics
[Verse]
Nine years since the pancake diner on Fulton Street
You laminated the receipt where we first sat to eat
[Chorus]
${hook} is what you gave
${hook} is what we save
[Verse]
Your wallet held that paper like a vow kept warm
Every year another dinner, every year another storm
[Chorus]
${hook} is what you gave
${hook} is what we save`;
}

function scriptedGenerate(opts?: { badDrafts?: boolean }): { gen: EngineGenerate; writes: string[] } {
  const writes: string[] = [];
  const gen: EngineGenerate = async (prompt, kind) => {
    if (kind === "plan") {
      if (prompt.includes("planning a song")) {
        return JSON.stringify({
          coreEmotion: "quiet pride in being kept",
          purpose: "celebrate nine years",
          pov: "first person to my wife, tonight",
          turn: "from a saved receipt to a saved life",
          spec: { tempo: "85-95 BPM", groove: "straight", barsPerSection: "verse 8, chorus 8", wordDensity: "moderate" },
        });
      }
      if (prompt.includes("naming a song")) {
        return JSON.stringify([
          "Laminated Love",
          "Receipt",
          "Fulton Street Forever",
          "What You Kept",
          "Nine Years Deep",
          "Paper Vow",
        ]);
      }
      if (prompt.includes("Plan the sections")) {
        return JSON.stringify([
          { tag: "[Verse]", job: "establish the diner and the receipt" },
          { tag: "[Chorus]", job: "declare what keeping means" },
          { tag: "[Verse]", job: "advance to the wallet and the years" },
          { tag: "[Chorus]", job: "repeat the declaration" },
        ]);
      }
      throw new Error(`unexpected plan prompt: ${prompt.slice(0, 60)}`);
    }
    writes.push(prompt);
    if (opts?.badDrafts) return "not a song at all, just prose with no format";
    const hookMatch = prompt.match(/The hook \(and title\): (.+)/);
    return goodDraft(hookMatch ? hookMatch[1].trim() : "What You Kept");
  };
  return { gen, writes };
}

describe("pipeline pure helpers", () => {
  it("parseFirstJson extracts balanced JSON from noisy text", () => {
    expect(parseFirstJson('here you go: {"a": {"b": "c}"}} trailing')).toEqual({ a: { b: "c}" } });
    expect(parseFirstJson('```json\n["x","y"]\n```')).toEqual(["x", "y"]);
    expect(() => parseFirstJson("no json here")).toThrow();
  });

  it("storyTokens keeps distinctive words and drops stopwords", () => {
    const tokens = storyTokens(STORY);
    expect(tokens).toContain("laminated");
    expect(tokens).toContain("fulton");
    expect(tokens).not.toContain("about");
    expect(tokens).not.toContain("the");
  });

  it("scoreHook prefers short, story-grounded, singable hooks", () => {
    const tokens = storyTokens(STORY);
    expect(scoreHook("Laminated Love", tokens)).toBeGreaterThan(scoreHook('A: "generic song"', tokens));
  });

  it("resolveGenre matches ids, names, and aliases; rejects unknown", () => {
    expect(resolveGenre(CURRICULUM_FIXTURE, "R&B")?.id).toBe("rnb");
    expect(resolveGenre(CURRICULUM_FIXTURE, "rnb")?.id).toBe("rnb");
    expect(resolveGenre(CURRICULUM_FIXTURE, "r and b")?.id).toBe("rnb");
    expect(resolveGenre(CURRICULUM_FIXTURE, "Hip-Hop")).toBeNull();
  });
});

describe("runEngine end-to-end (scripted model, real landing + checks)", () => {
  it("lands the room from a story cue, picks a hook, ships a checked draft", async () => {
    const { gen, writes } = scriptedGenerate();
    const stages: string[] = [];
    const result = await runEngine(
      CURRICULUM_FIXTURE,
      { genre: "R&B", story: STORY, vocals: "Female Solo" },
      gen,
      (label) => stages.push(label)
    );
    // "anniversary" is a strong cue for quiet-storm
    expect(result.meta.landing.roomId).toBe("quiet-storm");
    expect(result.meta.landing.rule).toBe("inferred");
    // the landing is SHOWN via a stage event (plan Rule 6 — never a silent swap)
    expect(stages.some((s) => s.includes("Quiet Storm"))).toBe(true);
    // ONE user input produces ONE song (founder order): exactly one write, no picking
    expect(writes.length).toBe(1);
    expect(result.meta.draftsTried).toBe(1);
    // the story arrived whole in every writer prompt (plan Step 0)
    for (const w of writes) expect(w).toContain(STORY);
    // writer prompts carry curriculum, profile, and room dials
    expect(writes[0]).toContain(CURRICULUM_FIXTURE.core);
    expect(writes[0]).toContain("Genre profile text for testing.");
    expect(writes[0]).toContain("dial one for testing");
    // output shape
    expect(result.text).toContain("Title:");
    expect(result.text).toContain("### Lyrics");
    expect(result.meta.engineVersion).toBeTruthy();
    expect(result.meta.curriculumHash).toBe("abc123def456");
    expect(result.meta.hook.length).toBeGreaterThan(0);
  });

  it("respects an explicit sub-genre pick over cues", async () => {
    const { gen } = scriptedGenerate();
    const result = await runEngine(
      CURRICULUM_FIXTURE,
      { genre: "R&B", story: STORY, subGenre: "Contemporary R&B" },
      gen
    );
    expect(result.meta.landing.roomId).toBe("contemporary-rnb");
    expect(result.meta.landing.rule).toBe("picked");
  });

  it("fails loud (never least-bad) after one guided retry when the writing flunks", async () => {
    const { gen, writes } = scriptedGenerate({ badDrafts: true });
    await expect(
      runEngine(CURRICULUM_FIXTURE, { genre: "R&B", story: STORY }, gen)
    ).rejects.toSatisfy((e: any) => e instanceof EngineFailure && e.status === 422 && e.reasons.length > 0);
    expect(writes.length).toBe(2); // the write, then exactly one guided retry — never more
  });

  it("rejects a missing story before spending anything", async () => {
    const { gen, writes } = scriptedGenerate();
    await expect(runEngine(CURRICULUM_FIXTURE, { genre: "R&B", story: "" }, gen)).rejects.toMatchObject({
      code: "story_required",
    });
    expect(writes.length).toBe(0);
  });
});
