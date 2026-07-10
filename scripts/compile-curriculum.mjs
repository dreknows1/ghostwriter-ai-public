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
  // R&B
  "Contemporary R&B": "contemporary-rnb",
  "90s R&B": "90s-rnb",
  "2000s R&B": "2000s-rnb",
  "Neo-Soul": "neo-soul",
  "Trap-Soul / Alt-R&B": "trap-soul",
  "Quiet Storm / Slow Jam": "quiet-storm",
  "Classic Soul / Motown": "classic-soul",
  // Hip-Hop
  "Boom-Bap": "boom-bap",
  "Trap": "trap",
  "Drill": "drill",
  "Melodic Rap": "melodic-rap",
  "Conscious / Storytelling": "conscious",
  "West Coast / G-Funk": "west-coast",
  "Southern Bounce / Club": "southern-bounce",
};

// The deep genres the engine carries: each maps a SUBGENRES section + a profile doc to a pack.
const GENRE_PACKS = [
  {
    section: "R&B", id: "rnb", name: "R&B",
    aliases: ["r&b", "rnb", "r and b", "randb", "rhythm and blues"],
    profileFile: "SONGWRITING_PROFILE_RNB.md",
    roomCount: 7,
  },
  {
    section: "Hip-Hop", id: "hiphop", name: "Hip-Hop",
    aliases: ["hip hop", "hiphop", "hip-hop", "rap"],
    profileFile: "SONGWRITING_PROFILE_HIPHOP.md",
    roomCount: 7,
  },
  {
    section: "Gospel", id: "gospel", name: "Gospel",
    aliases: ["gospel music", "praise", "worship music"],
    profileFile: "SONGWRITING_PROFILE_GOSPEL.md",
  },
  {
    section: "Reggae", id: "reggae", name: "Reggae",
    aliases: ["reggae music", "roots reggae", "lovers rock", "dancehall"],
    profileFile: "SONGWRITING_PROFILE_REGGAE.md",
  },
  {
    section: "Afrobeats", id: "afrobeats", name: "Afrobeats",
    aliases: ["afrobeat", "afro beats", "afro-fusion", "afropop"],
    profileFile: "SONGWRITING_PROFILE_AFROBEATS.md",
  },
  {
    section: "Pop", id: "pop", name: "Pop",
    aliases: ["pop music"],
    profileFile: "SONGWRITING_PROFILE_POP.md",
  },
  {
    section: "Reggaetón", id: "reggaeton", name: "Reggaetón",
    aliases: ["reggaeton", "reguetón", "regueton", "perreo", "urbano", "reggaeton music"],
    profileFile: "SONGWRITING_PROFILE_REGGAETON.md",
  },
  {
    section: "Bachata", id: "bachata", name: "Bachata",
    aliases: ["bachata music", "bachata sensual", "bachata moderna", "bachata tradicional"],
    profileFile: "SONGWRITING_PROFILE_BACHATA.md",
  },
  {
    section: "Regional Mexicano", id: "regionalmexicano", name: "Regional Mexicano",
    aliases: ["regional", "banda", "norteño", "norteno", "corrido", "sierreño", "sierreno", "musica mexicana", "música mexicana"],
    profileFile: "SONGWRITING_PROFILE_REGIONALMEXICANO.md",
  },
  {
    section: "Salsa", id: "salsa", name: "Salsa",
    aliases: ["salsa music", "salsa dura", "salsa romantica", "salsa romántica", "timba", "salsa brava"],
    profileFile: "SONGWRITING_PROFILE_SALSA.md",
  },
  {
    section: "Corrido Tumbado", id: "corridotumbado", name: "Corrido Tumbado",
    aliases: ["corridos tumbados", "tumbado", "tumbados", "corrido belico", "corrido bélico", "corridos belicos", "trap corrido", "corridos"],
    profileFile: "SONGWRITING_PROFILE_CORRIDOTUMBADO.md",
  },
  {
    section: "Cumbia", id: "cumbia", name: "Cumbia",
    aliases: ["cumbia music", "cumbia colombiana", "cumbia sonidera", "cumbia norteña", "cumbia nortena"],
    profileFile: "SONGWRITING_PROFILE_CUMBIA.md",
  },
  {
    section: "Merengue", id: "merengue", name: "Merengue",
    aliases: ["merengue music", "merengue tipico", "merengue típico", "perico ripiao"],
    profileFile: "SONGWRITING_PROFILE_MERENGUE.md",
  },
  {
    section: "Vallenato", id: "vallenato", name: "Vallenato",
    aliases: ["vallenato music", "vallenato paseo"],
    profileFile: "SONGWRITING_PROFILE_VALLENATO.md",
  },
  {
    section: "Mariachi / Ranchera", id: "mariachiranchera", name: "Mariachi / Ranchera",
    aliases: ["mariachi", "ranchera", "rancheras", "mariachi ranchera", "bolero ranchero"],
    profileFile: "SONGWRITING_PROFILE_MARIACHIRANCHERA.md",
  },
  {
    section: "Balada / Bolero", id: "baladabolero", name: "Balada / Bolero",
    aliases: ["balada", "bolero", "balada romantica", "balada romántica", "bolero clasico", "bolero clásico"],
    profileFile: "SONGWRITING_PROFILE_BALADABOLERO.md",
  },
  {
    section: "Pop Latino", id: "poplatino", name: "Pop Latino",
    aliases: ["latin pop", "pop en español", "pop en espanol"],
    profileFile: "SONGWRITING_PROFILE_POPLATINO.md",
  },
  {
    section: "Latin Trap / Trap Latino", id: "latintrap", name: "Latin Trap / Trap Latino",
    aliases: ["latin trap", "trap latino", "traplatino", "trap en español", "trap en espanol"],
    profileFile: "SONGWRITING_PROFILE_LATINTRAP.md",
  },
  {
    section: "Flamenco / Rumba", id: "flamencorumba", name: "Flamenco / Rumba",
    aliases: ["flamenco", "rumba", "rumba flamenca", "rumba catalana", "nuevo flamenco"],
    profileFile: "SONGWRITING_PROFILE_FLAMENCORUMBA.md",
  },
  {
    section: "Country", id: "country", name: "Country",
    aliases: ["country music", "honky-tonk", "honky tonk", "americana", "outlaw country"],
    profileFile: "SONGWRITING_PROFILE_COUNTRY.md",
  },
  {
    section: "Rock", id: "rock", name: "Rock",
    aliases: ["rock music", "rock and roll", "rock n roll", "classic rock", "hard rock", "alternative rock", "indie rock", "punk"],
    profileFile: "SONGWRITING_PROFILE_ROCK.md",
  },
  {
    section: "Soul", id: "soul", name: "Soul",
    aliases: ["soul music", "motown", "neo-soul", "neo soul", "deep soul", "southern soul"],
    profileFile: "SONGWRITING_PROFILE_SOUL.md",
  },
  {
    section: "Blues", id: "blues", name: "Blues",
    aliases: ["blues music", "delta blues", "chicago blues", "electric blues"],
    profileFile: "SONGWRITING_PROFILE_BLUES.md",
  },
  {
    section: "Jazz", id: "jazz", name: "Jazz",
    aliases: ["jazz music", "vocal jazz", "swing", "bebop"],
    profileFile: "SONGWRITING_PROFILE_JAZZ.md",
  },
  {
    section: "Folk", id: "folk", name: "Folk",
    aliases: ["folk music", "singer-songwriter", "singer songwriter", "folk-rock", "folk rock"],
    profileFile: "SONGWRITING_PROFILE_FOLK.md",
  },
  {
    section: "EDM", id: "edm", name: "EDM",
    aliases: ["electronic", "electronic dance music", "house", "techno", "dubstep", "edm music"],
    profileFile: "SONGWRITING_PROFILE_EDM.md",
  },
  {
    section: "Metal", id: "metal", name: "Metal",
    aliases: ["metal music", "heavy metal", "thrash", "metalcore", "death metal"],
    profileFile: "SONGWRITING_PROFILE_METAL.md",
  },
  {
    section: "MPB", id: "mpb", name: "MPB",
    aliases: ["musica popular brasileira", "música popular brasileira", "mpb brasileira"],
    profileFile: "SONGWRITING_PROFILE_MPB.md",
  },
  {
    section: "Bossa Nova", id: "bossanova", name: "Bossa Nova",
    aliases: ["bossa", "bossanova", "bossa-nova"],
    profileFile: "SONGWRITING_PROFILE_BOSSANOVA.md",
  },
  {
    section: "Sertanejo", id: "sertanejo", name: "Sertanejo",
    aliases: ["sertanejo universitario", "sertanejo universitário", "sofrencia", "sofrência", "moda de viola", "sertanejo raiz"],
    profileFile: "SONGWRITING_PROFILE_SERTANEJO.md",
  },
  {
    section: "Samba", id: "samba", name: "Samba",
    aliases: ["samba de raiz", "samba enredo", "samba-enredo", "partido alto", "partido-alto", "samba cancao", "samba canção"],
    profileFile: "SONGWRITING_PROFILE_SAMBA.md",
  },
  {
    section: "Pagode", id: "pagode", name: "Pagode",
    aliases: ["pagode romantico", "pagode romântico", "pagode 90", "pagode anos 90"],
    profileFile: "SONGWRITING_PROFILE_PAGODE.md",
  },
  {
    section: "Funk Carioca", id: "funkcarioca", name: "Funk Carioca",
    aliases: ["funk brasileiro", "baile funk", "funk ostentacao", "funk ostentação", "funk melody", "mandelao", "mandelão", "brazilian funk"],
    profileFile: "SONGWRITING_PROFILE_FUNKCARIOCA.md",
  },
  {
    section: "Forró", id: "forro", name: "Forró",
    aliases: ["forro", "pe de serra", "pé de serra", "pé-de-serra", "forro universitario", "forró universitário", "forro eletronico", "forró eletrônico", "xote", "baiao", "baião", "arrasta-pé", "arrasta-pe"],
    profileFile: "SONGWRITING_PROFILE_FORRO.md",
  },
  {
    section: "Pop Brasileiro", id: "popbrasileiro", name: "Pop Brasileiro",
    aliases: ["pop nacional", "pop brasil", "brazilian pop", "pop rock nacional"],
    profileFile: "SONGWRITING_PROFILE_POPBRASILEIRO.md",
  },
  {
    section: "Axé", id: "axe", name: "Axé",
    aliases: ["axe", "axe music", "axé music", "samba-reggae", "samba reggae", "trio eletrico", "trio elétrico"],
    profileFile: "SONGWRITING_PROFILE_AXE.md",
  },
  {
    section: "Piseiro / Arrocha", id: "piseiroarrocha", name: "Piseiro / Arrocha",
    aliases: ["piseiro", "pisadinha", "arrocha", "sofrencia", "sofrência", "paredao", "paredão", "seresta"],
    profileFile: "SONGWRITING_PROFILE_PISEIROARROCHA.md",
  },
  {
    section: "Fado", id: "fado", name: "Fado",
    aliases: ["fado castico", "fado castiço", "fado cancao", "fado canção", "novo fado", "fado tradicional", "fado portugues", "fado português"],
    profileFile: "SONGWRITING_PROFILE_FADO.md",
  },
  {
    section: "Kizomba", id: "kizomba", name: "Kizomba",
    aliases: ["tarraxinha", "tarraxa", "kizomba romantica", "kizomba romântica", "semba", "kizomba angolana"],
    profileFile: "SONGWRITING_PROFILE_KIZOMBA.md",
  },
  {
    section: "Chanson Française", id: "chanson", name: "Chanson Française",
    aliases: ["chanson francaise", "chanson", "chanson a texte", "chanson à texte", "chanson realiste", "chanson réaliste", "nouvelle scene", "nouvelle scène", "rive gauche"],
    profileFile: "SONGWRITING_PROFILE_CHANSON.md",
  },
  {
    section: "Variété Française", id: "variete", name: "Variété Française",
    aliases: ["variete francaise", "variété", "variete", "grande variete", "grande variété", "variété festive", "variete festive"],
    profileFile: "SONGWRITING_PROFILE_VARIETE.md",
  },
  {
    section: "Rap Français", id: "rapfr", name: "Rap Français",
    aliases: ["rap francais", "rap fr", "rap conscient", "drill fr", "drill français", "drill francais", "rap mélo", "rap melo", "cloud rap français"],
    profileFile: "SONGWRITING_PROFILE_RAPFR.md",
  },
  {
    section: "Zouk", id: "zouk", name: "Zouk",
    aliases: ["zouk love", "zouk beton", "zouk béton", "zouk retro", "zouk rétro", "zouk r&b", "nouveau zouk"],
    profileFile: "SONGWRITING_PROFILE_ZOUK.md",
  },
  {
    section: "Afro", id: "afro", name: "Afro",
    aliases: ["afro trap", "afrotrap", "coupé-décalé", "coupe-decale", "coupé décalé", "zouglou", "ndombolo", "afro mélo", "afro melo", "afro pop français"],
    profileFile: "SONGWRITING_PROFILE_AFRO.md",
  },
  {
    section: "Raï", id: "rai", name: "Raï",
    aliases: ["rai", "pop-rai", "pop-raï", "rai love", "raï love", "rai'n'b", "raï'n'b", "rain'b"],
    profileFile: "SONGWRITING_PROFILE_RAI.md",
  },
  {
    section: "Ballade Française", id: "balladefr", name: "Ballade Française",
    aliases: ["ballade francaise", "ballade", "grande ballade", "power ballad française", "power ballad francaise", "piano-voix", "piano voix"],
    profileFile: "SONGWRITING_PROFILE_BALLADEFR.md",
  },
  {
    section: "French Touch", id: "frenchtouch", name: "French Touch",
    aliases: ["french house", "filter house", "nu-disco", "nu disco", "electro française", "électro française", "touche française"],
    profileFile: "SONGWRITING_PROFILE_FRENCHTOUCH.md",
  },
  {
    section: "Slam", id: "slam", name: "Slam",
    aliases: ["slam poésie", "slam poesie", "spoken word français", "spoken word francais", "slam français", "slam francais"],
    profileFile: "SONGWRITING_PROFILE_SLAM.md",
  },
  {
    section: "RnB Français", id: "rnbfr", name: "RnB Français",
    aliases: ["rnb francais", "r&b français", "r&b francais", "rnb fr", "r&b fr", "rnb français 2000"],
    profileFile: "SONGWRITING_PROFILE_RNBFR.md",
  },
  {
    section: "Musette", id: "musette", name: "Musette",
    aliases: ["bal musette", "valse musette", "java", "musette manouche", "accordéon musette", "accordeon musette", "guinguette"],
    profileFile: "SONGWRITING_PROFILE_MUSETTE.md",
  },
];

// The plan's build check: no quoted lyric lines anywhere in compiled writer text.
const LYRIC_LINE_LINT = /"[A-Z][a-z][^"]{10,60}"/;

/** Room name -> id: historical map first, then a deterministic slug (text before any
 * "/", parentheticals dropped, & -> n, non-alphanumerics -> dashes). */
function roomIdFor(name) {
  if (ROOM_IDS[name]) return ROOM_IDS[name];
  return name.split("/")[0].replace(/\([^)]*\)/g, "").trim()
    .toLowerCase().replace(/&/g, "n").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

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

/** Room cards from one ## <Genre> section of SONGWRITING_SUBGENRES.md. */
export function compileRooms(subgenresMd, sectionName = "R&B", expectedCount = null) {
  const start = subgenresMd.indexOf(`\n## ${sectionName}\n`);
  if (start === -1) fail(`no ## ${sectionName} section in SONGWRITING_SUBGENRES.md`);
  const rest = subgenresMd.slice(start + 1);
  const end = rest.indexOf("\n## ");
  const section = end === -1 ? rest : rest.slice(0, end);

  const rooms = [];
  const blocks = section.split(/^(?=### )/m).slice(1);
  for (const block of blocks) {
    const name = block.split("\n", 1)[0].replace(/^### /, "").trim();
    const id = roomIdFor(name);
    if (!id) fail(`room heading "${name}" produced an empty id`);

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
  if (expectedCount !== null && rooms.length !== expectedCount) fail(`expected ${expectedCount} ${sectionName} rooms, found ${rooms.length}`);
  if (expectedCount === null && (rooms.length < 3 || rooms.length > 8)) fail(`${sectionName}: ${rooms.length} rooms is out of the sane 3-8 range`);
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

  const thinkHeader = profileMd.match(/^## (How an? [^\n]+ writer thinks)\s*$/im);
  if (!thinkHeader) fail('profile missing "## How a/an <Genre> writer thinks" section');
  const profileText = grab(thinkHeader[1]);
  const defaultName = grab("Declared safe default").split("\n")[0].trim();
  const defaultRoomId = roomIdFor(defaultName);
  if (!rooms.some((r) => r.id === defaultRoomId)) fail(`declared default "${defaultName}" is not one of this genre's rooms`);

  const cues = [];
  const cueSection = grab("Landing cues");
  let currentRoomId = null;
  for (const line of cueSection.split("\n")) {
    const heading = line.match(/^### (.+)$/);
    if (heading) {
      currentRoomId = roomIdFor(heading[1].trim());
      if (!rooms.some((r) => r.id === currentRoomId)) fail(`cue list under unknown room "${heading[1].trim()}"`);
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

/** "What disqualifies" grab is optional profile content — not compiled into the pack yet. */

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

/** Genre questionnaire worlds from SONGWRITING_GENRES.md — themes/purposes/instruments
 * per genre. Questionnaire concern; never enters the writer slice. */
export function compileGenreBuilder(genresMd) {
  const out = {};
  const sections = genresMd.split(/^(?=## )/m).slice(1);
  for (const section of sections) {
    const name = section.split("\n", 1)[0].replace(/^## /, "").trim();
    const themes = bulletText(section, "Themes:").split(";").map((x) => x.trim()).filter(Boolean);
    const purposes = bulletText(section, "Purposes:").split(";").map((x) => x.trim()).filter(Boolean);
    const instruments = bulletText(section, "Instrumentation options:").split(";").map((x) => x.trim()).filter(Boolean);
    if (themes.length < 3 || purposes.length < 2 || instruments.length < 3) {
      fail(`genre "${name}": questionnaire world too thin (needs themes>=3, purposes>=2, instruments>=3)`);
    }
    out[name] = { themes, purposes, instruments };
  }
  if (Object.keys(out).length < 10) fail(`genre builder suspiciously small (${Object.keys(out).length} genres)`);
  return out;
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

export function compile(brainMd, subgenresMd, profilesByGenreId, genresMd = "", langGenres = {}) {
  const core = compileCore(brainMd);
  if (core.length < 1500) fail(`core suspiciously small (${core.length} chars)`);
  // Back-compat: a lone string is the R&B profile (old signature).
  const profiles = typeof profilesByGenreId === "string" ? { rnb: profilesByGenreId } : profilesByGenreId;
  const packs = {};
  const allRooms = [];
  for (const def of GENRE_PACKS) {
    const profileMd = profiles[def.id];
    if (!profileMd) continue; // pack ships only when its profile exists
    const rooms = compileRooms(subgenresMd, def.section, def.roomCount ?? null);
    const { profileText, defaultRoomId, cues } = compileProfile(profileMd, rooms);
    packs[def.id] = {
      id: def.id,
      name: def.name,
      aliases: def.aliases,
      profileText,
      defaultRoomId,
      rooms,
      cues,
    };
    allRooms.push(...rooms.map((r) => ({ room: r, profileText })));
  }
  if (!packs.rnb) fail("R&B pack is required");

  // Mirrors the real writer prompt (pipeline.writerPrompt): storyFit is a landing
  // concern and never reaches the writer, so it doesn't count against the budget.
  const cardChars = (room) =>
    room.oneLine.length + room.tempoGroove.length + room.rendering.length +
    room.parodyTraps.length + room.performance.prose.length +
    room.writingDials.reduce((n, d) => n + d.length, 0);
  const largestSlice = Math.round(
    Math.max(...allRooms.map(({ room, profileText }) => core.length + profileText.length + cardChars(room))) / 4
  );
  if (largestSlice > 3900) fail(`per-song slice ${largestSlice} tokens exceeds the ~3,900 budget — prune, don't pile on (plan §1)`);

  const hashBuilder = createHash("sha256").update(brainMd).update(subgenresMd).update(genresMd);
  for (const id of Object.keys(profiles).sort()) hashBuilder.update(profiles[id]);
  for (const lang of Object.keys(langGenres || {}).sort()) {
    for (const g of Object.keys(langGenres[lang]).sort()) {
      hashBuilder.update(lang).update(g).update(JSON.stringify(langGenres[lang][g]));
    }
  }
  const hash = hashBuilder.digest("hex").slice(0, 12);

  const bannedPhrases = compileBannedPhrases(brainMd);
  const abstractionWords = compileAbstractionWords(brainMd);
  const validTags = compileValidTags(brainMd);
  const genreBuilder = genresMd ? compileGenreBuilder(genresMd) : {};
  const genreBuilderByLang = { English: genreBuilder, ...(langGenres || {}) };
  const compiled = {
    genreBuilder,
    genreBuilderByLang,
    core,
    bannedPhrases,
    abstractionWords,
    validTags,
    genres: packs,
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
  const profiles = {};
  for (const def of GENRE_PACKS) {
    try {
      profiles[def.id] = readFileSync(join(ROOT, def.profileFile), "utf8");
    } catch {
      if (def.id === "rnb") fail("SONGWRITING_PROFILE_RNB.md is required");
      // other packs ship when their profile lands
    }
  }
  const langGenres = {};
  for (const [lang, file] of [["Spanish", "SONGWRITING_GENRES_ES.md"], ["French", "SONGWRITING_GENRES_FR.md"], ["Portuguese", "SONGWRITING_GENRES_PT.md"]]) {
    try {
      langGenres[lang] = compileGenreBuilder(readFileSync(join(ROOT, file), "utf8"));
    } catch {
      // a language catalog ships when its file lands
    }
  }
  const compiled = compile(
    read("SONGWRITING_BRAIN.md"),
    read("SONGWRITING_SUBGENRES.md"),
    profiles,
    read("SONGWRITING_GENRES.md"),
    langGenres
  );
  writeFileSync(join(ROOT, "server/engine/curriculum.generated.ts"), render(compiled));
  const packSummary = Object.values(compiled.genres)
    .map((p) => `${p.name}: ${p.rooms.length} rooms/${p.cues.length} cues`)
    .join("; ");
  console.log(
    `curriculum compiled: hash ${compiled.hash}, core ~${compiled.approxTokens.core} tokens, ` +
    `largest per-song slice ~${compiled.approxTokens.largestSlice} tokens — ${packSummary}`
  );
  const langs = Object.entries(compiled.genreBuilderByLang).map(([l, g]) => `${l}:${Object.keys(g).length}`).join(", ");
  console.log(`  genre catalogs by language — ${langs}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(String(err?.message || err));
    process.exit(1);
  }
}
