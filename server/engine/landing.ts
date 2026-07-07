// Sub-genre landing (plan Step 1a) — Rules 1-4 of SONGWRITING_SUBGENRES.md Part 2.
// Pure, deterministic, zero LLM calls: the machine only counts marks, it never judges.
//
// RULE 1 — an explicit user pick always wins (the picker value, or a room named
//          inside the story). A pick we have no page for lands on the nearest
//          parent (the genre default) stamped not-yet-deep — never a silent swap.
// RULE 2 — otherwise infer from story cues: one strong cue fires alone; weak cues
//          need two distinct hits pointing at the same room.
// RULE 3 — when cues are weak or split, the genre's declared safe default.
// RULE 4 — exactly one room per song, even for fusions: when a pick names two
//          rooms at once ("trap soul r&b"), the longest single alias match takes
//          the spec slot — that room sets tempo and groove — and the record is
//          stamped not-yet-deep because no page exists under the fusion name.

import type { GenrePack, Landing, RoomCard } from "./types";

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/** Picker key: lowercase, punctuation and spaces removed ("Trap-Soul" -> "trapsoul"). */
function squash(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Scan form: lowercase, punctuation collapsed to single spaces ("Trap-Soul" -> "trap soul"). */
function scanNorm(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Whole-word/phrase containment on scan forms ("pier" never matches "piers"). */
function containsPhrase(haystackScan: string, phraseScan: string): boolean {
  if (!phraseScan) return false;
  return (" " + haystackScan + " ").includes(" " + phraseScan + " ");
}

// ---------------------------------------------------------------------------
// Alias derivation
// ---------------------------------------------------------------------------

/**
 * Single words that are also common English: as a lone story word they must
 * NEVER count as naming a room (Rule 1 guard — "contemporary" alone can't fire
 * for R&B), though they remain valid picker values. Invented or unmistakable
 * single words ("drill", "motown") are not listed, so they stay story-safe.
 */
const AMBIGUOUS_SINGLE_WORDS = new Set([
  "alt", "alternative", "classic", "contemporary", "modern", "new", "old",
  "school", "soul", "quiet", "storm", "smooth", "deep", "dirty", "hard",
  "soft", "southern", "northern", "western", "eastern", "coast", "country",
  "house", "roots", "golden", "future", "traditional", "pop", "wave",
  "urban", "indie", "neo", "progressive", "experimental",
  // Pop rooms strip to everyday story words ("Dance-Pop" -> "dance",
  // "Bedroom Pop" -> "bedroom", "Synth-Pop" -> "synth"): a first dance at a
  // wedding or a synth in a party brief must never read as naming a room.
  "dance", "bedroom", "synth",
]);

/** "80s" / "1980s" -> "eighties", so era picks match either spelling (Rule 1 era mapping). */
const DECADE_WORDS: Record<string, string> = {
  "20s": "twenties",
  "30s": "thirties",
  "40s": "forties",
  "50s": "fifties",
  "60s": "sixties",
  "70s": "seventies",
  "80s": "eighties",
  "90s": "nineties",
};

function decadeWord(token: string): string | undefined {
  const match = /^(?:19|20)?([2-9]0)s$/.exec(token);
  return match ? DECADE_WORDS[match[1] + "s"] : undefined;
}

/** One derived way of naming a room. */
type RoomAlias = {
  roomId: string;
  /** scan-normalized phrase for whole-word story matching */
  scan: string;
  /** squashed key for picker matching */
  key: string;
  /** Rule 1 guard flag: false for lone common-English words (see AMBIGUOUS_SINGLE_WORDS) */
  safeInStory: boolean;
};

/** Alternate spellings of one base text ("Alt-R&B" -> "alt rnb", "alt r and b"...). */
function spellingVariants(text: string): string[] {
  const variants = new Set<string>();
  variants.add(scanNorm(text));
  if (text.includes("&")) {
    variants.add(scanNorm(text.replace(/&/g, "n")));
    variants.add(scanNorm(text.replace(/&/g, " and ")));
  }
  for (const v of [...variants]) {
    // decade spellings: "80s glimmer" is also said "eighties glimmer"
    const words = v.split(" ");
    const respelled = words.map((w) => decadeWord(w) ?? w).join(" ");
    if (respelled !== v) variants.add(respelled);
    // "classic X" is also said "old school X"
    if (containsPhrase(v, "classic")) {
      variants.add((" " + v + " ").split(" classic ").join(" old school ").trim());
    }
  }
  variants.delete("");
  return [...variants];
}

function isSafeInStory(scan: string): boolean {
  return scan.includes(" ") || !AMBIGUOUS_SINGLE_WORDS.has(scan);
}

/**
 * Every way a user might name this room: its id, its full display name, each
 * "/"-separated segment, alternate spellings, genre-stripped short forms
 * ("90s R&B" -> "90s", "nineties"; "Contemporary R&B" -> "contemporary"), and
 * run-together one-word forms ("trap soul" -> "trapsoul").
 */
function aliasesForRoom(room: RoomCard, genreForms: string[]): RoomAlias[] {
  const bases = new Set<string>();
  bases.add(room.id.replace(/-/g, " "));
  bases.add(room.name);
  for (const segment of room.name.split("/")) bases.add(segment);

  const scans = new Set<string>();
  for (const base of bases) {
    for (const variant of spellingVariants(base)) {
      scans.add(variant);
      // short form with the genre's own name removed
      for (const genreForm of genreForms) {
        if (variant !== genreForm && containsPhrase(variant, genreForm)) {
          const short = scanNorm(
            (" " + variant + " ").split(" " + genreForm + " ").join(" ")
          );
          if (short) scans.add(short);
        }
      }
    }
  }

  const aliases: RoomAlias[] = [];
  for (const scan of scans) {
    aliases.push({ roomId: room.id, scan, key: squash(scan), safeInStory: isSafeInStory(scan) });
    // run-together spelling as its own story-safe word ("trapsoul")
    const joined = squash(scan);
    if (scan.includes(" ") && joined && !scans.has(joined)) {
      aliases.push({ roomId: room.id, scan: joined, key: joined, safeInStory: true });
    }
  }
  return aliases;
}

function buildAliases(pack: GenrePack): RoomAlias[] {
  const genreForms = new Set<string>();
  for (const form of [pack.name, ...pack.aliases]) {
    for (const variant of spellingVariants(form)) genreForms.add(variant);
  }
  const aliases: RoomAlias[] = [];
  for (const room of pack.rooms) {
    aliases.push(...aliasesForRoom(room, [...genreForms]));
  }
  return aliases;
}

// ---------------------------------------------------------------------------
// Landing
// ---------------------------------------------------------------------------

/**
 * Land the song in exactly ONE room of the given genre pack.
 * Deterministic: same pack + story + pick always returns the same Landing.
 */
export function landRoom(pack: GenrePack, story: string, explicitPick?: string): Landing {
  const aliases = buildAliases(pack);

  // RULE 1a — the picker value wins outright.
  const pick = (explicitPick ?? "").trim();
  if (pick) {
    const pickKey = squash(pick);
    const exact = aliases.find((a) => a.key === pickKey);
    if (exact) {
      return { roomId: exact.roomId, rule: "picked", firedCues: [], notYetDeep: false };
    }

    // Not an exact page name — look for room names spoken inside the pick.
    const pickScan = scanNorm(pick);
    const inside = aliases.filter((a) => containsPhrase(pickScan, a.scan));
    if (inside.length > 0) {
      const roomsNamed = new Set(inside.map((a) => a.roomId));
      // RULE 4 tempo-and-groove-slot tiebreak: when the pick names two rooms
      // ("trap soul r&b"), the LONGEST single alias match takes the spec slot —
      // that room sets tempo and groove; the other survives only as flavor.
      // Equal lengths fall back to room-id order so the result is deterministic.
      const longest = [...inside].sort(
        (a, b) => b.scan.length - a.scan.length || a.roomId.localeCompare(b.roomId)
      )[0];
      return {
        roomId: longest.roomId,
        rule: "picked",
        firedCues: [],
        // a fusion pick has no page under its own name -> not-yet-deep
        notYetDeep: roomsNamed.size > 1,
      };
    }

    // RULE 1 — a pick we have no page for: nearest parent we DO have (the
    // genre's default room), stamped not-yet-deep so the founder can see it.
    return { roomId: pack.defaultRoomId, rule: "picked", firedCues: [], notYetDeep: true };
  }

  const storyScan = scanNorm(story);

  // RULE 1b — the story itself names a room ("make it drill"). Whole-word
  // matches only, and lone common-English words never count (safeInStory).
  const named = aliases.filter((a) => a.safeInStory && containsPhrase(storyScan, a.scan));
  if (named.length > 0) {
    const sorted = [...named].sort((a, b) => b.scan.length - a.scan.length);
    const top = sorted[0];
    const rival = sorted.find(
      (a) => a.roomId !== top.roomId && a.scan.length === top.scan.length
    );
    // Longest alias wins (Rule 4's tiebreak again). If two rooms are named
    // with equal weight, the name alone can't decide — let cues or the
    // default settle it.
    if (!rival) {
      return { roomId: top.roomId, rule: "picked", firedCues: [], notYetDeep: false };
    }
  }

  // RULE 2 — infer from cue marks. Strong fires alone; weak needs two
  // DISTINCT hits for the same room. The machine only counts.
  const hitsByRoom = new Map<string, { strong: string[]; weak: string[] }>();
  for (const mark of pack.cues) {
    if (!containsPhrase(storyScan, scanNorm(mark.cue))) continue;
    const entry = hitsByRoom.get(mark.roomId) ?? { strong: [], weak: [] };
    const bucket = entry[mark.strength];
    if (!bucket.includes(mark.cue)) bucket.push(mark.cue);
    hitsByRoom.set(mark.roomId, entry);
  }

  const qualifying = [...hitsByRoom.entries()].filter(
    ([, hits]) => hits.strong.length >= 1 || hits.weak.length >= 2
  );
  if (qualifying.length > 0) {
    qualifying.sort(
      ([, a], [, b]) => b.strong.length - a.strong.length || b.weak.length - a.weak.length
    );
    const [topRoomId, topHits] = qualifying[0];
    const contested = qualifying.some(
      ([roomId, hits]) =>
        roomId !== topRoomId &&
        hits.strong.length === topHits.strong.length &&
        hits.weak.length === topHits.weak.length
    );
    if (!contested) {
      return {
        roomId: topRoomId,
        rule: "inferred",
        firedCues: [...topHits.strong, ...topHits.weak],
        notYetDeep: false,
      };
    }
    // Tie between rooms — cues are split, fall through to Rule 3.
  }

  // RULE 3 — the genre's declared safe default. Never a guess at a specialist
  // room: those are reached only by Rule 1 or a strong Rule 2 cue.
  return { roomId: pack.defaultRoomId, rule: "defaulted", firedCues: [], notYetDeep: false };
}

// ---------------------------------------------------------------------------
// Showing the decision (Rule 6: always shown, never a silent swap)
// ---------------------------------------------------------------------------

/** One plain sentence telling the user which room their song landed in and why. */
export function describeLanding(landing: Landing, pack: GenrePack): string {
  const room = pack.rooms.find((r) => r.id === landing.roomId);
  const roomName = room ? room.name : landing.roomId;

  let sentence: string;
  if (landing.rule === "picked") {
    sentence = landing.notYetDeep
      ? `Your pick landed in ${roomName}.`
      : `You chose ${roomName}.`;
  } else if (landing.rule === "inferred") {
    sentence = `Your story sounded like ${roomName} (because you mentioned: ${landing.firedCues.join(", ")}).`;
  } else {
    sentence = `We used ${pack.name}'s home base: ${roomName}.`;
  }

  if (landing.notYetDeep) {
    sentence +=
      " We don't have a deep page for that exact pick yet, so we used the closest room we know well.";
  }
  return sentence;
}
