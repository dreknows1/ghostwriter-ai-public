import { describe, expect, it } from "vitest";
import { estimateSyllables, runChecks, trimIsDeleteOnly } from "./checks";
import type { CheckResult, DraftReport, MusicalSpec, RoomCard } from "./types";

// ---------------------------------------------------------------------------
// SYNTHETIC fixtures only. Every lyric line below was written for this test
// file from neutral filler words — none is, or resembles, a real song lyric.
// ---------------------------------------------------------------------------

const CARD: RoomCard = {
  id: "test-room",
  name: "Test Room",
  oneLine: "a synthetic room used only by checker tests",
  tempoGroove: "60-70 BPM, slow swing, moderate word density",
  writingDials: ["keep chorus lines parallel", "let verses advance the story"],
  rendering: "warm keys, soft drums, sparse guitar",
  storyFit: "quiet object-centered stories",
  parodyTraps: "none — synthetic",
  performance: {
    prose: "sparse tasteful adlibs, soft delivery",
    adlibDensity: "sparse",
    minAdlibs: 2,
    deliveryTags: ["[Soft]", "[Harmonies]"],
  },
};

const VALID_TAGS = [
  "[Intro]", "[Verse]", "[Pre-Chorus]", "[Chorus]", "[Bridge]", "[Outro]",
  "[Soft]", "[Harmonies]", "[Falsetto]", "[Vocal Run]", "[Sax Solo]", "[Belting]",
];

const SPEC: MusicalSpec = { tempo: "60-70 BPM", groove: "slow swing", wordDensity: "moderate" };

const STORY =
  "My mentor kept a broken compass on the workbench beside the window of his repair shop, " +
  "and every winter he polished the copper case until the lid finally opened.";

const HOOK = "Broken Compass Turning Home";

const SUNO_PROMPT =
  "Warm contemporary ballad, mid tempo, soft keys and rounded bass, gentle swung drums, " +
  "intimate lead vocal with airy harmonies in the chorus, sparse guitar accents, tasteful " +
  "space between phrases, nostalgic and hopeful mood, clean modern mixdown with smooth low " +
  "end and a quiet fade.";

const GOOD_CHORUS = [
  "[Chorus]",
  "This broken compass keeps on turning home",
  "Copper needle spinning wide and slow",
  "I follow where the winter light has gone",
  "This broken compass keeps on turning home",
].join("\n");

const GOOD_LYRICS = [
  "[Verse]",
  "He kept it on the workbench every year",
  "Beside the frosted window in the cold",
  "Copper case gone green along the seam",
  "He said the needle knows a patient road",
  "",
  GOOD_CHORUS,
  "",
  "[Verse]",
  "The lid swung open on a thawing day",
  "A hairline crack across the painted north",
  "He laughed and traced the wobble with his thumb",
  "Said even lost directions point you forward",
  "",
  GOOD_CHORUS,
].join("\n");

function buildDraft(overrides: { title?: string; suno?: string; lyrics?: string } = {}): string {
  const title = overrides.title ?? "Broken Compass";
  const suno = overrides.suno ?? SUNO_PROMPT;
  const lyrics = overrides.lyrics ?? GOOD_LYRICS;
  return `Title: ${title}\n\n### SUNO Prompt\n${suno}\n\n### Lyrics\n${lyrics}\n`;
}

const OPTS = { story: STORY, card: CARD, spec: SPEC, hook: HOOK };

function getCheck(report: DraftReport, id: string): CheckResult {
  const found = report.checks.find((c) => c.id === id);
  if (!found) throw new Error(`no check with id "${id}" in report`);
  return found;
}

// ---------------------------------------------------------------------------

describe("runChecks — a clean draft", () => {
  it("passes every check with zero fails and zero warns", () => {
    const report = runChecks(buildDraft(), OPTS);
    expect(report.failCount).toBe(0);
    expect(report.warnCount).toBe(0);
    expect(report.checks.every((c) => c.ok)).toBe(true);
  });

  it("emits the base checks in stable order with the right severities", () => {
    const report = runChecks(buildDraft(), OPTS);
    // artist-names-in-suno always runs; banned-phrases and central-image only when
    // their opts are supplied (not in OPTS here).
    expect(report.checks.map((c) => c.id)).toEqual([
      "format", "leaked-labels", "story-fidelity", "hook-placement", "title-hook",
      "chorus-consistency", "metric-parallel", "nursery-rhyme", "word-density", "verse-advance",
      "artist-names-in-suno",
    ]);
    const severity = (id: string) => getCheck(report, id).severity;
    for (const id of ["format", "leaked-labels", "story-fidelity", "hook-placement", "chorus-consistency", "artist-names-in-suno"]) {
      expect(severity(id)).toBe("fail");
    }
    for (const id of ["title-hook", "metric-parallel", "nursery-rhyme", "word-density", "verse-advance"]) {
      expect(severity(id)).toBe("warn");
    }
  });
});

describe("banned-phrases (founder's house-style ban list)", () => {
  const banned = ["hearts entwined", "beat inside my heart", "honest truth"];

  it("does not run when no ban list is supplied", () => {
    const report = runChecks(buildDraft(), OPTS);
    expect(report.checks.find((c) => c.id === "banned-phrases")).toBeUndefined();
  });

  it("fails when a house-style phrase appears in the lyrics", () => {
    const lyrics = GOOD_LYRICS.replace("He said the needle knows a patient road", "Our hearts entwined along that patient road");
    const report = runChecks(buildDraft({ lyrics }), { ...OPTS, bannedPhrases: banned });
    const check = getCheck(report, "banned-phrases");
    expect(check.ok).toBe(false);
    expect(check.severity).toBe("fail");
    expect(check.detail).toContain("hearts entwined");
  });

  it("passes a clean draft against the ban list", () => {
    const report = runChecks(buildDraft(), { ...OPTS, bannedPhrases: banned });
    expect(getCheck(report, "banned-phrases").ok).toBe(true);
  });
});

describe("central-image (anti-greeting-card anchor)", () => {
  it("does not run when no central image is supplied", () => {
    const report = runChecks(buildDraft(), OPTS);
    expect(report.checks.find((c) => c.id === "central-image")).toBeUndefined();
  });

  it("passes when the image lives in two or more lyric lines", () => {
    // GOOD_LYRICS mentions the compass in the chorus (twice) and a copper case line
    const report = runChecks(buildDraft(), { ...OPTS, centralImage: "broken compass" });
    expect(getCheck(report, "central-image").ok).toBe(true);
  });

  it("fails when the image is absent from the song", () => {
    const report = runChecks(buildDraft(), { ...OPTS, centralImage: "rusted bicycle bell" });
    const check = getCheck(report, "central-image");
    expect(check.ok).toBe(false);
    expect(check.severity).toBe("fail");
  });
});

describe("artist-names-in-suno", () => {
  it("passes a production prompt that describes the sound without naming artists", () => {
    expect(getCheck(runChecks(buildDraft(), OPTS), "artist-names-in-suno").ok).toBe(true);
  });

  it("fails a 'think X meets Y' artist name-drop", () => {
    const suno = SUNO_PROMPT + " Think Sade meets Anita Baker.";
    const check = getCheck(runChecks(buildDraft({ suno }), OPTS), "artist-names-in-suno");
    expect(check.ok).toBe(false);
    expect(check.severity).toBe("fail");
  });
});

describe("performance layer (tags & adlibs, BRAIN Layer 6)", () => {
  // A synthetic song WITH performance tags on their own lines and adlibs in parens.
  const PERFORMED = [
    "[Soft]",
    "[Verse]",
    "He kept it on the workbench every year (mmm)",
    "Beside the frosted window in the cold",
    "Copper case gone green along the seam",
    "He said the needle knows a patient road (patient road)",
    "[Chorus]",
    "This broken compass keeps on turning home (turning home)",
    "Copper needle spinning wide and slow",
    "I follow where the winter light has gone",
    "This broken compass keeps on turning home",
    "[Harmonies]",
    "[Chorus]",
    "This broken compass keeps on turning home (oh)",
    "Copper needle spinning wide and slow",
    "I follow where the winter light has gone",
    "This broken compass keeps on turning home (turning home)",
  ].join("\n");
  const PERF_OPTS = { ...OPTS, minAdlibs: 2, validTags: VALID_TAGS };

  it("does not run performance checks without performance context", () => {
    const ids = runChecks(buildDraft(), OPTS).checks.map((c) => c.id);
    expect(ids).not.toContain("adlibs-present");
    expect(ids).not.toContain("performance-tags");
    expect(ids).not.toContain("tags-own-line");
  });

  it("a fully performed draft passes all performance checks", () => {
    const report = runChecks(buildDraft({ lyrics: PERFORMED }), PERF_OPTS);
    for (const id of ["adlibs-present", "performance-tags", "invalid-tags", "tags-own-line"]) {
      expect(getCheck(report, id).ok).toBe(true);
    }
  });

  it("fails a bare draft with no adlibs and no delivery tags", () => {
    const bare = ["[Verse]", "just plain lines here", "no adlibs no delivery tags", "[Chorus]", "still nothing extra", "still nothing extra"].join("\n");
    const report = runChecks(buildDraft({ lyrics: bare }), PERF_OPTS);
    expect(getCheck(report, "adlibs-present").ok).toBe(false);
    expect(getCheck(report, "performance-tags").ok).toBe(false);
  });

  it("fails invented key:value tags (the [Energy: High] junk) but not real creative tags", () => {
    const bad = ["[Energy: High]", "[Verse]", "a line here (yeah)", "another line (oh)", "[Vamp]", "[Chorus]", "hook line one (go)", "hook line one (go)"].join("\n");
    const report = runChecks(buildDraft({ lyrics: bad }), PERF_OPTS);
    const check = getCheck(report, "invalid-tags");
    expect(check.ok).toBe(false);
    expect(check.detail).toContain("Energy: High");
    // [Vamp] is a real creative cue, off our fixture list — a warning, never a hard fail
    expect(getCheck(report, "unknown-tags").ok).toBe(false);
  });

  it("fails a bracket tag placed inline inside a lyric line", () => {
    const inline = ["[Verse]", "I miss you [Belting] every night (mmm)", "the copper case still turns (oh)", "[Chorus]", "turning home again (home)", "turning home again (home)"].join("\n");
    const report = runChecks(buildDraft({ lyrics: inline }), PERF_OPTS);
    expect(getCheck(report, "tags-own-line").ok).toBe(false);
  });
});

describe("format", () => {
  it("fails on unstructured text", () => {
    const report = runChecks("just some words\nwith no structure at all", OPTS);
    const format = getCheck(report, "format");
    expect(format.ok).toBe(false);
    expect(report.failCount).toBeGreaterThan(0);
  });

  it("fails on a missing or empty Title line", () => {
    const noTitle = `### SUNO Prompt\n${SUNO_PROMPT}\n### Lyrics\n${GOOD_LYRICS}\n`;
    const check = getCheck(runChecks(noTitle, OPTS), "format");
    expect(check.ok).toBe(false);
    expect(check.detail).toContain("Title");

    const emptyTitle = getCheck(runChecks(buildDraft({ title: "" }), OPTS), "format");
    expect(emptyTitle.ok).toBe(false);
  });

  it("fails when the SUNO prompt is under 25 or over 120 words", () => {
    const short = getCheck(runChecks(buildDraft({ suno: "warm keys and soft drums" }), OPTS), "format");
    expect(short.ok).toBe(false);
    expect(short.detail).toContain("SUNO prompt");

    const long = getCheck(runChecks(buildDraft({ suno: "word ".repeat(130).trim() }), OPTS), "format");
    expect(long.ok).toBe(false);
  });

  it("fails when the lyrics have no [Chorus] tag", () => {
    const verseOnly = ["[Verse]", "He kept it on the workbench every year"].join("\n");
    const check = getCheck(runChecks(buildDraft({ lyrics: verseOnly }), OPTS), "format");
    expect(check.ok).toBe(false);
    expect(check.detail).toContain("[Chorus]");
  });

  it("fails when the ### Lyrics section is missing entirely", () => {
    const noLyrics = `Title: Broken Compass\n\n### SUNO Prompt\n${SUNO_PROMPT}\n`;
    const check = getCheck(runChecks(noLyrics, OPTS), "format");
    expect(check.ok).toBe(false);
    expect(check.detail).toContain("Lyrics");
  });
});

describe("leaked-labels", () => {
  it("flags planner field names in the lyrics", () => {
    const draft = buildDraft({ lyrics: `${GOOD_LYRICS}\ncoreEmotion: quiet grief` });
    const check = getCheck(runChecks(draft, OPTS), "leaked-labels");
    expect(check.ok).toBe(false);
    expect(check.detail).toContain("coreemotion");
  });

  it("flags JSON-ish curly-brace blocks", () => {
    const draft = buildDraft({ lyrics: `${GOOD_LYRICS}\n{"roomId": "test-room", "turn": "reveal"}` });
    const check = getCheck(runChecks(draft, OPTS), "leaked-labels");
    expect(check.ok).toBe(false);
    expect(check.detail).toContain("curly-brace");
  });

  it("flags markdown headers inside the lyrics body", () => {
    const draft = buildDraft({ lyrics: `${GOOD_LYRICS}\n## production notes` });
    expect(getCheck(runChecks(draft, OPTS), "leaked-labels").ok).toBe(false);
  });

  it("flags the literal GENERATION_DECLINED string", () => {
    const draft = buildDraft({ lyrics: `${GOOD_LYRICS}\nGENERATION_DECLINED` });
    expect(getCheck(runChecks(draft, OPTS), "leaked-labels").ok).toBe(false);
  });

  it('flags "Step 1" and "the brief" artifacts', () => {
    const draft = buildDraft({ lyrics: `${GOOD_LYRICS}\nStep 1 of the brief says begin softly` });
    const check = getCheck(runChecks(draft, OPTS), "leaked-labels");
    expect(check.ok).toBe(false);
    expect(check.detail).toContain("step 1");
    expect(check.detail).toContain("the brief");
  });
});

describe("story-fidelity", () => {
  it("fails when the lyrics ignore the story's specifics", () => {
    const generic = [
      "[Verse]",
      "I wander through another quiet evening",
      "Counting shadows on a silent wall",
      "",
      "[Chorus]",
      "Nothing here remembers where I started",
      "Nothing here remembers me at all",
    ].join("\n");
    const check = getCheck(runChecks(buildDraft({ lyrics: generic }), OPTS), "story-fidelity");
    expect(check.ok).toBe(false);
    expect(check.severity).toBe("fail");
  });

  it("passes with a detail note when the story is too short to verify", () => {
    const shortStory = { ...OPTS, story: "I feel so much love tonight" };
    const check = getCheck(runChecks(buildDraft(), shortStory), "story-fidelity");
    expect(check.ok).toBe(true);
    expect(check.detail).toBe("story too short to verify");
  });

  it("matches with first-5-chars stem tolerance (plural story words hit singular lyrics)", () => {
    const stemStory = { ...OPTS, story: "All those broken compasses on the workbenches he never fixed" };
    const check = getCheck(runChecks(buildDraft(), stemStory), "story-fidelity");
    expect(check.ok).toBe(true);
  });
});

describe("hook-placement", () => {
  it("fails when the first chorus does not carry the hook", () => {
    const hookless = [
      "[Verse]",
      "He kept it on the workbench every year",
      "",
      "[Chorus]",
      "Nothing here remembers where I started",
      "Nothing here remembers me at all",
    ].join("\n");
    const check = getCheck(runChecks(buildDraft({ lyrics: hookless }), OPTS), "hook-placement");
    expect(check.ok).toBe(false);
  });

  it("passes at exactly 60% of title content words and fails below it", () => {
    // the check reads the song's own Title; good chorus contains copper, needle, winter
    const atBoundary = getCheck(runChecks(buildDraft({ title: "copper needle winter garden road" }), OPTS), "hook-placement");
    expect(atBoundary.ok).toBe(true);

    const below = getCheck(runChecks(buildDraft({ title: "copper needle stone garden road" }), OPTS), "hook-placement");
    expect(below.ok).toBe(false);
  });

  it("fails when there is no chorus block at all", () => {
    const verseOnly = ["[Verse]", "He kept it on the workbench every year"].join("\n");
    const check = getCheck(runChecks(buildDraft({ lyrics: verseOnly }), OPTS), "hook-placement");
    expect(check.ok).toBe(false);
    expect(check.detail).toContain("no [Chorus]");
  });
});

describe("title-hook", () => {
  it("warns when the title shares no content word with the hook", () => {
    // "Copper Needle" is in the chorus (so hook-placement passes) but shares no word
    // with the HOOK "Broken Compass Turning Home" — so only title-hook warns.
    const report = runChecks(buildDraft({ title: "Copper Needle" }), OPTS);
    const check = getCheck(report, "title-hook");
    expect(check.ok).toBe(false);
    expect(check.severity).toBe("warn");
    expect(report.failCount).toBe(0);
    expect(report.warnCount).toBe(1);
  });

  it("passes when the title carries a hook word", () => {
    expect(getCheck(runChecks(buildDraft({ title: "Turning Home" }), OPTS), "title-hook").ok).toBe(true);
  });
});

describe("chorus-consistency", () => {
  it("fails when the second chorus drifts from the first", () => {
    const drifting = [
      "[Verse]",
      "He kept it on the workbench every year",
      "",
      "[Chorus]",
      "This broken compass keeps on turning home",
      "Copper needle spinning wide and slow",
      "",
      "[Chorus]",
      "Paper lanterns drifting down the stream",
      "Every answer scatters in the current",
    ].join("\n");
    const check = getCheck(runChecks(buildDraft({ lyrics: drifting }), OPTS), "chorus-consistency");
    expect(check.ok).toBe(false);
    expect(check.severity).toBe("fail");
  });

  it("passes with a single chorus block", () => {
    const single = [
      "[Verse]",
      "He kept it on the workbench every year",
      "",
      GOOD_CHORUS,
    ].join("\n");
    const check = getCheck(runChecks(buildDraft({ lyrics: single }), OPTS), "chorus-consistency");
    expect(check.ok).toBe(true);
    expect(check.detail).toContain("fewer than two");
  });

  it("passes a final vamp that embellishes but still loops the hook (Quiet Storm move)", () => {
    // title carries the hook words; the vamp adds runs/adlibs but keeps the hook line
    const vamped = [
      "[Chorus]",
      "This broken compass keeps on turning home",
      "Copper needle spinning wide and slow",
      "[Vamp]",
      "This broken compass keeps on turning home (turning, turning)",
      "Keeps on turning (oh) home (yeah, home)",
      "This broken compass keeps on turning home",
    ].join("\n");
    const check = getCheck(runChecks(buildDraft({ title: "Turning Home", lyrics: vamped }), OPTS), "chorus-consistency");
    expect(check.ok).toBe(true);
  });
});

describe("metric-parallel", () => {
  it("warns when chorus lines have a syllable spread over 3", () => {
    const lopsided = [
      "[Verse]",
      "He kept it on the workbench every year",
      "",
      "[Chorus]",
      "Home",
      "The copper needle spins around the frozen workbench in the evening",
    ].join("\n");
    const check = getCheck(runChecks(buildDraft({ lyrics: lopsided }), OPTS), "metric-parallel");
    expect(check.ok).toBe(false);
    expect(check.severity).toBe("warn");
  });

  it("passes on the near-parallel good chorus", () => {
    expect(getCheck(runChecks(buildDraft(), OPTS), "metric-parallel").ok).toBe(true);
  });
});

describe("nursery-rhyme", () => {
  it("flags six same-length AABB-rhymed consecutive lines", () => {
    const singSong = [
      "[Verse]",
      "I walk along the way",
      "I sing a song today",
      "The light is soft and low",
      "I watch the water flow",
      "The moon is high and bright",
      "I hold the fading light",
      "",
      GOOD_CHORUS,
    ].join("\n");
    const check = getCheck(runChecks(buildDraft({ lyrics: singSong }), OPTS), "nursery-rhyme");
    expect(check.ok).toBe(false);
    expect(check.severity).toBe("warn");
  });

  it("does not flag varied lines with mixed endings", () => {
    expect(getCheck(runChecks(buildDraft(), OPTS), "nursery-rhyme").ok).toBe(true);
  });
});

describe("word-density", () => {
  it("warns when lines are too wordy for a low-density spec", () => {
    const lowSpec = { ...OPTS, spec: { ...SPEC, wordDensity: "low — spare phrasing" } };
    const check = getCheck(runChecks(buildDraft(), lowSpec), "word-density");
    expect(check.ok).toBe(false); // good draft averages ~7.3 words/line, above the 3-7 band
    expect(check.severity).toBe("warn");
  });

  it("warns when lines are too sparse for a dense spec", () => {
    const denseSpec = { ...OPTS, spec: { ...SPEC, wordDensity: "high, dense stacked phrasing" } };
    expect(getCheck(runChecks(buildDraft(), denseSpec), "word-density").ok).toBe(false);
  });

  it("skips (passes) when the density text maps to no band", () => {
    const oddSpec = { ...OPTS, spec: { ...SPEC, wordDensity: "syncopated chatter" } };
    const check = getCheck(runChecks(buildDraft(), oddSpec), "word-density");
    expect(check.ok).toBe(true);
    expect(check.detail).toContain("no recognized density band");
  });
});

describe("verse-advance", () => {
  it("warns when verse 2 is verse 1 barely reworded", () => {
    const repeated = [
      "[Verse]",
      "He kept it on the workbench every year",
      "Beside the frosted window in the cold",
      "",
      GOOD_CHORUS,
      "",
      "[Verse]",
      "He kept it on the workbench every season",
      "Beside the frosted window in the cold",
    ].join("\n");
    const check = getCheck(runChecks(buildDraft({ lyrics: repeated }), OPTS), "verse-advance");
    expect(check.ok).toBe(false);
    expect(check.severity).toBe("warn");
  });

  it("passes with a single verse", () => {
    const oneVerse = [
      "[Verse]",
      "He kept it on the workbench every year",
      "",
      GOOD_CHORUS,
    ].join("\n");
    expect(getCheck(runChecks(buildDraft({ lyrics: oneVerse }), OPTS), "verse-advance").ok).toBe(true);
  });
});

describe("estimateSyllables", () => {
  it("counts 12 common words exactly", () => {
    const exact: Array<[string, number]> = [
      ["cat", 1], ["time", 1], ["walked", 1],
      ["hello", 2], ["table", 2], ["window", 2], ["music", 2], ["wanted", 2], ["yellow", 2],
      ["beautiful", 3], ["banana", 3], ["remember", 3],
    ];
    for (const [word, syllables] of exact) {
      expect(estimateSyllables(word), word).toBe(syllables);
    }
  });

  it("stays within ±1 on 3 hard words", () => {
    const hard: Array<[string, number]> = [
      ["everything", 3], ["poetry", 3], ["chocolate", 3],
    ];
    for (const [word, syllables] of hard) {
      expect(Math.abs(estimateSyllables(word) - syllables), word).toBeLessThanOrEqual(1);
    }
  });

  it("sums across a line and ignores punctuation and case", () => {
    expect(estimateSyllables("the cat sat on the mat")).toBe(6);
    expect(estimateSyllables("Don't stop believing now!")).toBe(6);
    expect(estimateSyllables("")).toBe(0);
    expect(estimateSyllables("   ")).toBe(0);
  });
});

describe("trimIsDeleteOnly", () => {
  const original = [
    "[Verse]",
    "line alpha stands alone",
    "line beta follows after",
    "line gamma closes out",
    "",
    "[Chorus]",
    "line delta rings twice",
    "line delta rings twice",
  ].join("\n");

  it("true when lines are only deleted", () => {
    const trimmed = ["[Verse]", "line alpha stands alone", "line gamma closes out"].join("\n");
    expect(trimIsDeleteOnly(original, trimmed)).toBe(true);
  });

  it("true when nothing changes, and tolerant of surrounding whitespace", () => {
    expect(trimIsDeleteOnly(original, original)).toBe(true);
    expect(trimIsDeleteOnly(original, "  line alpha stands alone  \n\n   line beta follows after")).toBe(true);
  });

  it("true when everything is deleted", () => {
    expect(trimIsDeleteOnly(original, "")).toBe(true);
  });

  it("false when surviving lines are reordered", () => {
    const reordered = ["line beta follows after", "line alpha stands alone"].join("\n");
    expect(trimIsDeleteOnly(original, reordered)).toBe(false);
  });

  it("false when a line is reworded or a new line appears", () => {
    expect(trimIsDeleteOnly(original, "line alpha stands proudly alone")).toBe(false);
    expect(trimIsDeleteOnly(original, "line alpha stands alone\na brand new line")).toBe(false);
  });

  it("false when a duplicated line is kept more times than the original has", () => {
    const tripled = ["line delta rings twice", "line delta rings twice", "line delta rings twice"].join("\n");
    expect(trimIsDeleteOnly(original, tripled)).toBe(false);
  });
});
