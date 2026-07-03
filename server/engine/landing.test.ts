import { describe, it, expect } from "vitest";
import { landRoom, describeLanding } from "./landing";
import type { GenrePack, RoomCard } from "./types";

/**
 * Synthetic fixture — an invented genre ("Glimmer") with invented rooms and
 * invented cues. Deliberately NOT the real curriculum: the real GenrePack
 * arrives later via codegen, and these tests must outlive its edits.
 */
function room(id: string, name: string, oneLine: string): RoomCard {
  return {
    id,
    name,
    oneLine,
    tempoGroove: "70-100 BPM, easy sway, medium word density",
    writingDials: ["keep phrases short", "let the hook breathe"],
    rendering: "warm keys, soft drums, close vocal",
    storyFit: "everyday love and loss",
    parodyTraps: "no stock pet names",
    performance: { prose: "tasteful adlibs", adlibDensity: "moderate", minAdlibs: 4, deliveryTags: ["[Soft]", "[Harmonies]"] },
  };
}

const PACK: GenrePack = {
  id: "glimmer",
  name: "Glimmer",
  aliases: ["glimmer music", "glim"],
  profileText: "A made-up genre used only for testing the landing rules.",
  defaultRoomId: "velvet-hour",
  rooms: [
    room("velvet-hour", "Velvet Hour", "the genre's broad mainstream center"),
    room("night-drift", "Night-Drift / Alt-Glimmer", "late, moody, spacious"),
    room("porch-swing", "Porch Swing", "front-yard warmth"),
    room("80s-glimmer", "80s Glimmer", "big neon era feel"),
    room("classic-shine", "Classic Shine", "the old-school room"),
    room("contemporary-glimmer", "Contemporary Glimmer", "today's mainstream take"),
    room("hollowtide", "Hollowtide", "the strange specialist corner"),
  ],
  cues: [
    { cue: "moonlit pier", strength: "strong", roomId: "night-drift" },
    { cue: "neon puddles", strength: "weak", roomId: "night-drift" },
    { cue: "last ferry home", strength: "weak", roomId: "night-drift" },
    { cue: "porch lemonade", strength: "strong", roomId: "porch-swing" },
    { cue: "creaky rocking chair", strength: "weak", roomId: "porch-swing" },
    { cue: "county fair", strength: "weak", roomId: "porch-swing" },
    { cue: "cassette deck", strength: "strong", roomId: "80s-glimmer" },
    { cue: "arcade tokens", strength: "weak", roomId: "80s-glimmer" },
    { cue: "lantern parade", strength: "strong", roomId: "classic-shine" },
    { cue: "candle wax", strength: "weak", roomId: "classic-shine" },
    { cue: "group chat", strength: "weak", roomId: "contemporary-glimmer" },
    { cue: "voice memo", strength: "weak", roomId: "contemporary-glimmer" },
  ],
};

const PLAIN_STORY = "A song about my brother teaching me to ride a bike.";

describe("RULE 1a — explicit picker value wins", () => {
  it("picks by room id", () => {
    const landing = landRoom(PACK, PLAIN_STORY, "night-drift");
    expect(landing).toEqual({ roomId: "night-drift", rule: "picked", firedCues: [], notYetDeep: false });
  });

  it("picks by full room name, punctuation and case ignored", () => {
    const landing = landRoom(PACK, PLAIN_STORY, "Night-Drift / Alt-Glimmer");
    expect(landing.roomId).toBe("night-drift");
    expect(landing.rule).toBe("picked");
    expect(landing.notYetDeep).toBe(false);
  });

  it("picks by derived alias variants", () => {
    // run-together spelling
    expect(landRoom(PACK, PLAIN_STORY, "nightdrift").roomId).toBe("night-drift");
    // "/"-segment of a compound name
    expect(landRoom(PACK, PLAIN_STORY, "alt glimmer").roomId).toBe("night-drift");
    // era short forms: "80s Glimmer" answers to "80s" and "eighties"
    expect(landRoom(PACK, PLAIN_STORY, "80s").roomId).toBe("80s-glimmer");
    expect(landRoom(PACK, PLAIN_STORY, "eighties").roomId).toBe("80s-glimmer");
    // "classic" is also said "old school"
    expect(landRoom(PACK, PLAIN_STORY, "old school shine").roomId).toBe("classic-shine");
    // genre-stripped short form — fine as a PICKER value even though it is
    // a common English word (the guard only applies to story text)
    expect(landRoom(PACK, PLAIN_STORY, "contemporary").roomId).toBe("contemporary-glimmer");
  });

  it("unmatched pick lands on the default room, stamped not-yet-deep", () => {
    const landing = landRoom(PACK, PLAIN_STORY, "yodelcore");
    expect(landing).toEqual({ roomId: "velvet-hour", rule: "picked", firedCues: [], notYetDeep: true });
  });

  it("fusion pick naming two rooms: longest single alias takes the spec slot (Rule 4), stamped not-yet-deep", () => {
    // "80s porch swing" names both 80s-glimmer ("80s", 3 chars) and
    // porch-swing ("porch swing", 11 chars) — the longest alias wins the
    // tempo-and-groove slot, and no page exists under the fusion name.
    const landing = landRoom(PACK, PLAIN_STORY, "80s porch swing");
    expect(landing).toEqual({ roomId: "porch-swing", rule: "picked", firedCues: [], notYetDeep: true });
  });

  it("an explicit pick beats any story cues", () => {
    const story = "Moonlit pier, neon puddles, waiting on the last ferry home.";
    const landing = landRoom(PACK, story, "porch swing");
    expect(landing.roomId).toBe("porch-swing");
    expect(landing.rule).toBe("picked");
    expect(landing.firedCues).toEqual([]);
  });
});

describe("RULE 1b — the story itself names a room", () => {
  it("a room named inside the story counts as a pick", () => {
    const landing = landRoom(PACK, "Make it night drift, about my sister leaving town.");
    expect(landing).toEqual({ roomId: "night-drift", rule: "picked", firedCues: [], notYetDeep: false });
  });

  it("an unmistakable single-word room name fires from story text", () => {
    const landing = landRoom(PACK, "Give me a hollowtide song about the empty house.");
    expect(landing.roomId).toBe("hollowtide");
    expect(landing.rule).toBe("picked");
  });

  it("an ambiguous common-English single word does NOT fire from story text", () => {
    // "contemporary" is an alias of contemporary-glimmer but also plain
    // English — alone in a story it must not count as naming the room.
    const landing = landRoom(PACK, "We want a contemporary sound for a promise we made.");
    expect(landing).toEqual({ roomId: "velvet-hour", rule: "defaulted", firedCues: [], notYetDeep: false });
  });

  it("the same room's FULL name in the story does fire", () => {
    const landing = landRoom(PACK, "Write me a contemporary glimmer song about rent week.");
    expect(landing.roomId).toBe("contemporary-glimmer");
    expect(landing.rule).toBe("picked");
  });
});

describe("RULE 2 — cue inference (strong fires alone, weak needs a partner)", () => {
  it("one strong cue lands the room", () => {
    const landing = landRoom(PACK, "We kissed at the moonlit pier and drove back slow.");
    expect(landing).toEqual({
      roomId: "night-drift",
      rule: "inferred",
      firedCues: ["moonlit pier"],
      notYetDeep: false,
    });
  });

  it("two distinct weak cues for the same room land it", () => {
    const landing = landRoom(PACK, "Neon puddles on the road while we ran for the last ferry home.");
    expect(landing.roomId).toBe("night-drift");
    expect(landing.rule).toBe("inferred");
    expect(landing.firedCues).toEqual(["neon puddles", "last ferry home"]);
  });

  it("one weak cue alone is not enough — falls to the default", () => {
    const landing = landRoom(PACK, "Just neon puddles everywhere tonight.");
    expect(landing).toEqual({ roomId: "velvet-hour", rule: "defaulted", firedCues: [], notYetDeep: false });
  });

  it("the same weak cue repeated still counts once", () => {
    const landing = landRoom(PACK, "Neon puddles here, neon puddles there, neon puddles everywhere.");
    expect(landing.rule).toBe("defaulted");
    expect(landing.roomId).toBe("velvet-hour");
  });

  it("a strong cue beats another room's pile of weak cues", () => {
    const story = "Porch lemonade in her hand, neon puddles outside, missing the last ferry home.";
    const landing = landRoom(PACK, story);
    expect(landing.roomId).toBe("porch-swing");
    expect(landing.rule).toBe("inferred");
    expect(landing.firedCues).toEqual(["porch lemonade"]);
  });

  it("a tie between rooms falls to the default", () => {
    const story = "A moonlit pier and porch lemonade on the same long night.";
    const landing = landRoom(PACK, story);
    expect(landing).toEqual({ roomId: "velvet-hour", rule: "defaulted", firedCues: [], notYetDeep: false });
  });

  it("cues match whole words only — no substring false positives", () => {
    // "piers" must not match the cue "moonlit pier"
    const landing = landRoom(PACK, "All the moonlit piers were closed that summer.");
    expect(landing.rule).toBe("defaulted");
  });
});

describe("RULE 3 — safe default", () => {
  it("no pick, no room named, no cues: the genre's declared default", () => {
    const landing = landRoom(PACK, PLAIN_STORY);
    expect(landing).toEqual({ roomId: "velvet-hour", rule: "defaulted", firedCues: [], notYetDeep: false });
  });
});

describe("describeLanding — the decision is always shown (Rule 6)", () => {
  it("picked", () => {
    const note = describeLanding(landRoom(PACK, PLAIN_STORY, "porch swing"), PACK);
    expect(note).toBe("You chose Porch Swing.");
  });

  it("inferred names the room and the cues that fired", () => {
    const note = describeLanding(landRoom(PACK, "We kissed at the moonlit pier."), PACK);
    expect(note).toContain("Night-Drift / Alt-Glimmer");
    expect(note).toContain("moonlit pier");
    expect(note).toBe(
      "Your story sounded like Night-Drift / Alt-Glimmer (because you mentioned: moonlit pier)."
    );
  });

  it("defaulted names the genre's home base", () => {
    const note = describeLanding(landRoom(PACK, PLAIN_STORY), PACK);
    expect(note).toBe("We used Glimmer's home base: Velvet Hour.");
  });

  it("not-yet-deep landings say so in plain words", () => {
    const note = describeLanding(landRoom(PACK, PLAIN_STORY, "yodelcore"), PACK);
    expect(note).toBe(
      "Your pick landed in Velvet Hour. We don't have a deep page for that exact pick yet, so we used the closest room we know well."
    );
  });
});

describe("determinism — same input, same output", () => {
  it("every rule path returns identical results across repeated calls", () => {
    const inputs: Array<[string, string | undefined]> = [
      [PLAIN_STORY, "night-drift"], // picked
      [PLAIN_STORY, "80s porch swing"], // fusion tiebreak
      ["We kissed at the moonlit pier.", undefined], // inferred
      ["Neon puddles and the last ferry home.", undefined], // weak pair
      [PLAIN_STORY, undefined], // defaulted
    ];
    for (const [story, pick] of inputs) {
      const first = landRoom(PACK, story, pick);
      for (let i = 0; i < 5; i++) {
        expect(landRoom(PACK, story, pick)).toEqual(first);
      }
      expect(describeLanding(landRoom(PACK, story, pick), PACK)).toBe(
        describeLanding(first, PACK)
      );
    }
  });
});
