// Compiles the curriculum documents into server/engine/curriculum.generated.ts.
// SONGWRITING_ENGINE_PLAN.md §1 is the spec: the curriculum IS the engine — this is
// the plumbing that makes editing the documents change the app, with fail-loud checks
// so it can never silently rot the way the old guides did.
//
// Sources (repo root):
//   SONGWRITING_BRAIN.md        -> universal writer core (Layers 1, 2, 3, 5)
//   SONGWRITING_SUBGENRES.md    -> room cards (## R&B section)
//   SONGWRITING_PROFILE_RNB.md  -> genre profile + declared default + marked cues
//
// Deterministic: identical inputs produce identical bytes (no timestamps).

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const ROOM_IDS = {
  "Contemporary R&B": "contemporary-rnb",
  "90s R&B": "90s-rnb",
  "2000s R&B": "2000s-rnb",
  "Neo-Soul": "neo-soul",
  "Trap-Soul / Alt-R&B": "trap-soul",
  "Quiet Storm / Slow Jam": "quiet-storm",
  "Classic Soul / Motown": "classic-soul",
};

// The plan's build check: no quoted lyric lines anywhere in compiled writer text.
const LYRIC_LINE_LINT = /"[A-Z][a-z][^"]{10,60}"/;

export function fail(message) {
  throw new Error(`curriculum compile failed: ${message}`);
}

/** Universal core: BRAIN Layers 1, 2, 3. Layer 4 (genre) lives in profile + room card;
 * Layer 5 (the composing process) is enacted by the engine pipeline itself, so the
 * writer never needs its prose; OPEN is founder scratch space. */
export function compileCore(brainMd) {
  const wanted = ["## Layer 1", "## Layer 2", "## Layer 3"];
  const sections = brainMd.split(/^(?=## )/m);
  const kept = [];
  for (const section of sections) {
    const header = section.split("\n", 1)[0];
    if (!wanted.some((w) => header.startsWith(w))) continue;
    const title = header.replace(/^## Layer \d+ — /, "");
    const body = section.slice(header.length);
    kept.push(`${title}\n${body}`.trim());
  }
  if (kept.length !== 3) fail(`expected 3 core layers from SONGWRITING_BRAIN.md, found ${kept.length}`);
  // The raw house-style and abstraction lists are CODE-check inputs, not writer prose —
  // the writer gets the LAW sentences plus the ban list injected at write time. Drop the
  // raw list bullets from the core so they don't spend the per-song token budget.
  const withoutLists = stripRawLists(kept.join("\n\n"));
  return withoutLists.replace(/\n{3,}/g, "\n\n").trim();
}

/** Drop the indented list items under the House-style and concrete-image-law bullets,
 * keeping the law sentences themselves. */
function stripRawLists(text) {
  const lines = text.split("\n");
  const out = [];
  let skipping = false;
  for (const line of lines) {
    const isSubBullet = /^\s{2,}- /.test(line);
    if (/House-style words/.test(line) || /concrete-image law/.test(line)) {
      out.push(line);
      skipping = true;
      continue;
    }
    if (skipping && isSubBullet) continue; // drop the raw phrase/word bullets
    if (skipping && !isSubBullet && line.trim() !== "") skipping = false;
    out.push(line);
  }
  return out.join("\n");
}

function bulletText(block, label) {
  const re = new RegExp(`^- \\*\\*${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\*\\* ?(.*)$`, "m");
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

/** Room cards from the ## R&B section of SONGWRITING_SUBGENRES.md. */
export function compileRooms(subgenresMd) {
  const start = subgenresMd.indexOf("\n## R&B\n");
  if (start === -1) fail("no ## R&B section in SONGWRITING_SUBGENRES.md");
  const rest = subgenresMd.slice(start + 1);
  const end = rest.indexOf("\n## ");
  const section = end === -1 ? rest : rest.slice(0, end);

  const rooms = [];
  const blocks = section.split(/^(?=### )/m).slice(1);
  for (const block of blocks) {
    const name = block.split("\n", 1)[0].replace(/^### /, "").trim();
    const id = ROOM_IDS[name];
    if (!id) fail(`unmapped room heading "${name}" — add it to ROOM_IDS`);

    const oneLineMatch = block.match(/^\*(.+)\*\s*$/m);
    const dials = [];
    const dialSection = block.split("- **How the writing changes:**")[1] || "";
    for (const line of dialSection.split("\n")) {
      const m = line.match(/^ {2}- (.+)$/);
      if (m) dials.push(m[1].trim());
      else if (line.startsWith("- **")) break;
    }
    const firewall = bulletText(block, "Cross-genre firewall:");
    if (firewall) dials.push(`Cross-genre firewall: ${firewall}`);

    const perfText = bulletText(block, "How it performs (tags & adlibs):");
    if (!perfText) fail(`room "${name}": missing "How it performs (tags & adlibs)" bullet`);

    // Builder data: instrumentation palette + which themes/purposes fit this room.
    // UI/questionnaire concern — never enters the writer slice.
    const instrText = bulletText(block, "Instrumentation options:");
    if (!instrText) fail(`room "${name}": missing "Instrumentation options" bullet`);
    const instruments = instrText.split(";").map((x) => x.trim()).filter(Boolean);
    const fitsText = bulletText(block, "Builder fits:");
    if (!fitsText) fail(`room "${name}": missing "Builder fits" bullet`);
    const themesM = fitsText.match(/themes:\s*([^|]+)\|/i);
    const purposesM = fitsText.match(/purposes:\s*(.+)$/i);
    if (!themesM || !purposesM) fail(`room "${name}": Builder fits must be "themes: a; b | purposes: c; d"`);
    const builder = {
      instruments,
      themes: themesM[1].split(";").map((x) => x.trim()).filter(Boolean),
      purposes: purposesM[1].split(";").map((x) => x.trim()).filter(Boolean),
    };
    if (builder.instruments.length < 3 || builder.themes.length < 2 || builder.purposes.length < 2) {
      fail(`room "${name}": builder data suspiciously thin`);
    }
    const density = (perfText.match(/Density (sparse|moderate|heavy)/i) || [])[1];
    const minAdlibs = Number((perfText.match(/min adlibs (\d+)/i) || [])[1]);
    const tagsChunk = (perfText.match(/delivery tags ([^.]+)\./i) || [])[1] || "";
    const deliveryTags = (tagsChunk.match(/\[[^\]]+\]/g) || []);
    if (!density || !Number.isInteger(minAdlibs) || minAdlibs < 2 || deliveryTags.length < 2) {
      fail(`room "${name}": performance bullet must state Density, min adlibs (>=2), and >=2 delivery tags`);
    }

    const card = {
      id,
      name,
      oneLine: oneLineMatch ? oneLineMatch[1].trim() : "",
      tempoGroove: bulletText(block, "Tempo & groove:"),
      writingDials: dials,
      rendering: bulletText(block, "How it renders (Suno production prompt):"),
      storyFit: bulletText(block, "Stories it serves:"),
      parodyTraps: bulletText(block, "What makes it a parody:"),
      performance: { prose: perfText, adlibDensity: density.toLowerCase(), minAdlibs, deliveryTags },
      builder,
    };
    for (const [field, value] of Object.entries(card)) {
      if (field === "writingDials" ? value.length < 3 : field === "performance" || field === "builder" ? false : !value) {
        fail(`room "${name}": empty field ${field}`);
      }
    }
    rooms.push(card);
  }
  if (rooms.length !== 7) fail(`expected 7 R&B rooms, found ${rooms.length}`);
  return rooms;
}

/** Genre profile + declared default + marked cue lists from SONGWRITING_PROFILE_RNB.md. */
export function compileProfile(profileMd, rooms) {
  const grab = (header) => {
    const re = new RegExp(`^## ${header}\\s*$`, "m");
    const m = profileMd.match(re);
    if (!m) fail(`profile missing "## ${header}" section`);
    const from = m.index + m[0].length;
    const next = profileMd.slice(from).search(/^## /m);
    return (next === -1 ? profileMd.slice(from) : profileMd.slice(from, from + next)).trim();
  };

  const profileText = grab("How an R&B writer thinks");
  const defaultName = grab("Declared safe default").split("\n")[0].trim();
  const defaultRoomId = ROOM_IDS[defaultName];
  if (!defaultRoomId) fail(`declared default "${defaultName}" is not a known room`);

  const cues = [];
  const cueSection = grab("Landing cues");
  let currentRoomId = null;
  for (const line of cueSection.split("\n")) {
    const heading = line.match(/^### (.+)$/);
    if (heading) {
      currentRoomId = ROOM_IDS[heading[1].trim()];
      if (!currentRoomId) fail(`cue list under unknown room "${heading[1].trim()}"`);
      continue;
    }
    const cue = line.match(/^- \((strong|weak)\) (.+)$/);
    if (cue) {
      if (!currentRoomId) fail("cue bullet before any room heading");
      cues.push({ cue: cue[2].trim().toLowerCase(), strength: cue[1], roomId: currentRoomId });
    } else if (line.trim().startsWith("-")) {
      fail(`unparseable cue line: "${line.trim()}"`);
    }
  }
  for (const room of rooms) {
    if (!cues.some((c) => c.roomId === room.id)) fail(`no landing cues for room "${room.name}"`);
  }
  return { profileText, defaultRoomId, cues };
}

/** The house-style ban list from BRAIN Layer 3 — semicolon-separated bullet phrases
 * under the "House-style words" bullet. Compiled for the code check; the prose stays
 * in the core so the writer is warned up front. */
export function compileBannedPhrases(brainMd) {
  const start = brainMd.indexOf("**House-style words");
  if (start === -1) fail("BRAIN is missing the House-style words ban list (Layer 3)");
  const rest = brainMd.slice(start);
  const phrases = [];
  for (const line of rest.split("\n").slice(1)) {
    const m = line.match(/^ {2}- (.+)$/);
    if (!m) { if (line.startsWith("- **") || line.startsWith("## ")) break; continue; }
    for (const p of m[1].split(";")) {
      const phrase = p.trim().toLowerCase();
      if (phrase) phrases.push(phrase);
    }
  }
  if (phrases.length < 10) fail(`ban list suspiciously small (${phrases.length} phrases)`);
  return phrases;
}

/** The abstraction word list from BRAIN Layer 2 — the "abstraction words" sub-bullet,
 * comma-separated. A central image made only of these is rejected (concrete-image law). */
export function compileAbstractionWords(brainMd) {
  const marker = "**abstraction words";
  const start = brainMd.indexOf(marker);
  if (start === -1) fail("BRAIN is missing the abstraction words list (concrete-image law, Layer 2)");
  const afterColon = brainMd.indexOf(":**", start);
  const lineEnd = brainMd.indexOf("\n\n", afterColon);
  const chunk = brainMd.slice(afterColon + 3, lineEnd === -1 ? undefined : lineEnd);
  const words = chunk
    .split(",")
    .map((w) => w.replace(/\s+/g, " ").trim().toLowerCase())
    .filter((w) => w && /^[a-z]+$/.test(w));
  if (words.length < 20) fail(`abstraction list suspiciously small (${words.length} words)`);
  return [...new Set(words)];
}

/** The valid Suno tag list from BRAIN Layer 6 — the only tags the renderer reads. */
export function compileValidTags(brainMd) {
  const marker = "**Valid Suno tags";
  const start = brainMd.indexOf(marker);
  if (start === -1) fail("BRAIN is missing the Valid Suno tags list (Layer 6)");
  const lineEnd = brainMd.indexOf("\n", brainMd.indexOf(":**", start));
  const chunk = brainMd.slice(start, lineEnd === -1 ? undefined : lineEnd);
  const tags = (chunk.match(/\[[^\]]+\]/g) || []).map((t) => t.trim());
  if (tags.length < 20) fail(`valid-tag list suspiciously small (${tags.length} tags)`);
  return [...new Set(tags)];
}

export function lintNoLyricLines(compiled) {
  const texts = [compiled.core];
  for (const pack of Object.values(compiled.genres)) {
    texts.push(pack.profileText);
    for (const room of pack.rooms) {
      texts.push(room.rendering, ...room.writingDials);
    }
  }
  for (const text of texts) {
    const hit = text.match(LYRIC_LINE_LINT);
    if (hit) fail(`quoted lyric-line pattern in compiled text: ${hit[0]}`);
  }
}

export function compile(brainMd, subgenresMd, profileMd) {
  const core = compileCore(brainMd);
  if (core.length < 1500) fail(`core suspiciously small (${core.length} chars)`);
  const rooms = compileRooms(subgenresMd);
  const { profileText, defaultRoomId, cues } = compileProfile(profileMd, rooms);

  // Mirrors the real writer prompt (pipeline.writerPrompt): storyFit is a landing
  // concern and never reaches the writer, so it doesn't count against the budget.
  const cardChars = (room) =>
    room.oneLine.length + room.tempoGroove.length + room.rendering.length +
    room.parodyTraps.length + room.performance.prose.length +
    room.writingDials.reduce((n, d) => n + d.length, 0);
  const largestCard = Math.max(...rooms.map(cardChars));
  const largestSlice = Math.round((core.length + profileText.length + largestCard) / 4);
  if (largestSlice > 3700) fail(`per-song slice ${largestSlice} tokens exceeds the ~3,700 budget — prune, don't pile on (plan §1)`);

  const hash = createHash("sha256")
    .update(brainMd).update(subgenresMd).update(profileMd)
    .digest("hex").slice(0, 12);

  const bannedPhrases = compileBannedPhrases(brainMd);
  const abstractionWords = compileAbstractionWords(brainMd);
  const validTags = compileValidTags(brainMd);
  const compiled = {
    core,
    bannedPhrases,
    abstractionWords,
    validTags,
    genres: {
      rnb: {
        id: "rnb",
        name: "R&B",
        aliases: ["r&b", "rnb", "r and b", "randb", "rhythm and blues"],
        profileText,
        defaultRoomId,
        rooms,
        cues,
      },
    },
    hash,
    approxTokens: { core: Math.round(core.length / 4), largestSlice },
  };
  lintNoLyricLines(compiled);
  return compiled;
}

export function render(compiled) {
  return `// GENERATED by scripts/compile-curriculum.mjs — DO NOT EDIT.
// Edit the curriculum documents instead: SONGWRITING_BRAIN.md,
// SONGWRITING_SUBGENRES.md, SONGWRITING_PROFILE_RNB.md — then npm run compile:curriculum.
import type { CompiledCurriculum } from "./types";

export const CURRICULUM: CompiledCurriculum = ${JSON.stringify(compiled, null, 2)};
`;
}

function main() {
  const read = (name) => {
    try {
      return readFileSync(join(ROOT, name), "utf8");
    } catch {
      fail(`cannot read ${name} — the curriculum documents are the engine; this file is required`);
    }
  };
  const compiled = compile(
    read("SONGWRITING_BRAIN.md"),
    read("SONGWRITING_SUBGENRES.md"),
    read("SONGWRITING_PROFILE_RNB.md")
  );
  writeFileSync(join(ROOT, "server/engine/curriculum.generated.ts"), render(compiled));
  console.log(
    `curriculum compiled: hash ${compiled.hash}, core ~${compiled.approxTokens.core} tokens, ` +
    `largest per-song slice ~${compiled.approxTokens.largestSlice} tokens, ` +
    `${compiled.genres.rnb.rooms.length} R&B rooms, ${compiled.genres.rnb.cues.length} cues`
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(String(err?.message || err));
    process.exit(1);
  }
}
