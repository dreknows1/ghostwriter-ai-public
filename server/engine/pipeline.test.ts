import { describe, it, expect } from "vitest";
import type { CompiledCurriculum, RoomCard } from "./types";
import {
  EngineFailure,
  isConcreteImage,
  parseFirstJson,
  resolveGenre,
  runEngine,
  runTitleIdeas,
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
  performance: {
    prose: "Test room performs with tasteful adlibs and a soft delivery.",
    adlibDensity: "sparse",
    minAdlibs: 2,
    deliveryTags: ["[Soft]", "[Harmonies]"],
  },
});

const CURRICULUM_FIXTURE: CompiledCurriculum = {
  core: "Core craft text for testing. A song is a felt emotion delivered through structure.",
  bannedPhrases: ["hearts entwined", "beat inside my heart", "honest truth"],
  abstractionWords: ["sun", "sunlight", "colors", "distance", "shade", "light", "goodbye", "space", "memory", "love", "heart", "dream", "drift", "fade"],
  validTags: ["[Intro]", "[Verse]", "[Pre-Chorus]", "[Chorus]", "[Bridge]", "[Outro]", "[Soft]", "[Harmonies]", "[Falsetto]", "[Vocal Run]", "[Crooning]", "[Sax Solo]"],
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
[Verse: soft, intimate]
Nine years since the pancake diner on Fulton Street
You laminated the receipt where we first sat to eat (ooh)
Tucked behind your license, kept it all this time
A little slip of paper says you once were mine
[Chorus: warm harmonies]
${hook} is what you gave (gave)
${hook} is what we save
[Verse: soft]
That laminated receipt still rides inside your wallet warm
Every winter dinner, every summer storm
The pancake house closed down but you kept the proof
Four faded lines of ink still telling me the truth
[Chorus: warm harmonies]
${hook} is what you gave (stay)
${hook} is what we save (stay with me)`;
}

function scriptedGenerate(opts?: { badDrafts?: boolean; abstractImageFirst?: boolean }): {
  gen: EngineGenerate;
  writes: string[];
} {
  const writes: string[] = [];
  let briefCalls = 0;
  const gen: EngineGenerate = async (prompt, kind) => {
    if (kind === "plan") {
      if (prompt.includes("planning a song")) {
        briefCalls++;
        // Simulate a model that first returns an abstract image, then a concrete one
        // after the re-plan feedback lands in the prompt.
        const abstractTry = opts?.abstractImageFirst && briefCalls === 1 && !prompt.includes("too abstract");
        return JSON.stringify({
          coreEmotion: "quiet pride in being kept",
          purpose: "celebrate nine years",
          pov: "first person to my wife, tonight",
          turn: "from a saved receipt to a saved life",
          centralImage: abstractTry ? "the fading light of love" : "the laminated receipt",
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
    // The writer prompt states the hook as either "is FIXED: X" (user title) or
    // "Suggested hook: X" (auto); the scripted writer just echoes it as the Title.
    const hookMatch = prompt.match(/is FIXED: (.+?)\. Use it/) || prompt.match(/Suggested hook: (.+?) —/);
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

  it("isConcreteImage accepts real things and rejects pure abstraction", () => {
    const abstract = ["sun", "sunlight", "colors", "distance", "shade", "light", "goodbye", "space", "love", "fade", "drift"];
    expect(isConcreteImage("a chipped coffee mug", abstract)).toBe(true);
    expect(isConcreteImage("the old army jacket", abstract)).toBe(true);
    expect(isConcreteImage("orange enamel pot", abstract)).toBe(true);
    // pure abstraction / greeting-card images
    expect(isConcreteImage("the fading sunlight", abstract)).toBe(false);
    expect(isConcreteImage("a long goodbye", abstract)).toBe(false);
    expect(isConcreteImage("colors", abstract)).toBe(false);
    expect(isConcreteImage("the space between us", abstract)).toBe(false);
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

  it("fails loud (never least-bad) after exhausting the guided retries", async () => {
    const { gen, writes } = scriptedGenerate({ badDrafts: true });
    await expect(
      runEngine(CURRICULUM_FIXTURE, { genre: "R&B", story: STORY }, gen)
    ).rejects.toSatisfy((e: any) => e instanceof EngineFailure && e.status === 422 && e.reasons.length > 0);
    expect(writes.length).toBe(3); // up to 3 internal attempts, then fail loud — never a least-bad ship
  });

  it("rejects a missing story before spending anything (unless a theme was picked)", async () => {
    const { gen, writes } = scriptedGenerate();
    await expect(runEngine(CURRICULUM_FIXTURE, { genre: "R&B", story: "" }, gen)).rejects.toMatchObject({
      code: "story_required",
    });
    expect(writes.length).toBe(0);
  });

  it("re-plans the brief when the central image is pure abstraction (concrete-image law)", async () => {
    const { gen } = scriptedGenerate({ abstractImageFirst: true });
    const result = await runEngine(CURRICULUM_FIXTURE, { genre: "R&B", story: STORY }, gen);
    // the abstract "fading light of love" was rejected; the re-plan produced a real thing
    expect(result.meta.brief.centralImage).toBe("the laminated receipt");
  });

  it("a user-chosen title becomes THE hook — no candidates generated", async () => {
    const { gen, writes } = scriptedGenerate();
    const result = await runEngine(
      CURRICULUM_FIXTURE,
      { genre: "R&B", story: STORY, title: "Receipt In Your Wallet" },
      gen
    );
    expect(result.meta.hook).toBe("Receipt In Your Wallet");
    expect(result.text).toContain("Title: Receipt In Your Wallet");
    // exactly one write; the naming step never ran (no hooks prompt hit the model)
    expect(writes.length).toBe(1);
  });

  it("picks alone can carry a song (no story) — and the writer is told not to invent details", async () => {
    const { gen, writes } = scriptedGenerate();
    const result = await runEngine(
      CURRICULUM_FIXTURE,
      { genre: "R&B", story: "", theme: "Deep love / devotion", purpose: "Slow dance", audience: "One person" },
      gen
    );
    expect(result.text).toContain("Title:");
    expect(writes[0]).toContain("NO STORY WAS GIVEN");
    expect(writes[0]).toContain("NEVER invent fake personal details");
  });

  it("runTitleIdeas returns up to 5 candidates plus the room, without writing a song", async () => {
    const { gen, writes } = scriptedGenerate();
    const ideas = await runTitleIdeas(CURRICULUM_FIXTURE, { genre: "R&B", story: STORY }, gen);
    expect(ideas.titles.length).toBeGreaterThanOrEqual(3);
    expect(ideas.titles.length).toBeLessThanOrEqual(5);
    expect(ideas.roomName).toBe("Quiet Storm");
    expect(ideas.landingNote).toContain("anniversary");
    expect(writes.length).toBe(0); // ideas only — no song was written, nothing charged
  });
});
