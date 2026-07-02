/**
 * Deterministic Suno style-prompt builder — plain code over guide data, no LLM.
 * The genre library already knows every subgenre's instruments, BPM, and vocal
 * character (e.g. Bachata: requinto lead guitar, güira, bongos, 100-130 BPM).
 * Previously a heuristic decided whether this data was used; now it always is.
 */

import type { GenreGuide, SubGenreProfile } from "./guides/types";

export interface StyleChips {
  vocals?: string; // "Female Solo" | "Male Solo" | "Duo/Group" | ...
  mood?: string;
}

function pick<T>(arr: T[] | undefined, n: number): T[] {
  return (arr || []).slice(0, n);
}

function vocalPhrase(vocals?: string): string {
  const v = (vocals || "").toLowerCase();
  if (v.includes("female")) return "female lead vocal";
  if (v.includes("male")) return "male lead vocal";
  if (v.includes("duet") || v.includes("duo") || v.includes("group")) return "duet vocals trading lines";
  if (v.includes("choir")) return "full choir vocals";
  return "expressive lead vocal";
}

export function buildSunoStylePrompt(
  guide: GenreGuide | null,
  sub: SubGenreProfile | null,
  chips: StyleChips = {}
): string {
  const moodOk = chips.mood && chips.mood.toLowerCase() !== "match the creative direction";
  if (!guide) {
    return `${moodOk ? chips.mood + " " : ""}song with ${vocalPhrase(chips.vocals)}.`;
  }

  const name = sub ? `${sub.name} ${guide.name}` : guide.name;
  const bpm = sub?.bpmRange
    ? Math.round((sub.bpmRange.min + sub.bpmRange.max) / 2)
    : guide.rhythmAndGroove?.bpmRange?.sweet;

  const instruments = pick(
    sub?.distinguishingFeatures?.length ? undefined : guide.instrumentation?.coreInstruments,
    4
  );
  const parts: string[] = [];

  parts.push(`${name} track`);
  if (sub?.description) parts.push(sub.description.split(".")[0]);

  if (sub?.distinguishingFeatures?.length) {
    parts.push(pick(sub.distinguishingFeatures, 3).join(", "));
  } else if (instruments.length) {
    parts.push(instruments.join(", "));
  }

  // Parent-genre signature sounds only when there's no subgenre profile — a parent
  // "Latin" dembow note has no business in a Bachata prompt.
  if (!sub) {
    const signature = pick(guide.sonicPalette?.signatureSounds, 2);
    if (signature.length) parts.push(signature.join(", "));
  }

  if (sub?.productionNotes) parts.push(sub.productionNotes.split(".")[0]);
  else if (guide.productionFingerprint?.mixAesthetic) parts.push(guide.productionFingerprint.mixAesthetic.split(".")[0]);

  parts.push(vocalPhrase(chips.vocals));
  if (moodOk) parts.push(`${chips.mood!.toLowerCase()} mood`);
  if (bpm) parts.push(`around ${bpm} BPM`);

  // Compose to a flowing ~40-70 word description, deduped and trimmed.
  const seen = new Set<string>();
  const clean = parts
    .map((p) => p.trim().replace(/\s+/g, " "))
    .filter((p) => {
      const k = p.toLowerCase();
      if (!p || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  let text = clean.join(". ") + ".";
  const words = text.split(/\s+/);
  if (words.length > 80) text = words.slice(0, 80).join(" ") + ".";
  return text.replace(/\.\./g, ".");
}
