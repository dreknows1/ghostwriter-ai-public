#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { internal } from "../convex/_generated/api.js";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function readJson(filePath) {
  const raw = fs.readFileSync(path.resolve(filePath), "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected array JSON in ${filePath}`);
  }
  return parsed;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch === "\r") {
      // ignore CR; LF handles row boundaries
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function readJsonOrCsv(filePath) {
  const raw = fs.readFileSync(path.resolve(filePath), "utf8");
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) throw new Error(`Expected array JSON in ${filePath}`);
    return parsed;
  }

  const lines = parseCsv(raw);
  if (!lines.length) return [];
  const headers = lines[0].map((h) => String(h || "").trim());
  const out = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = lines[i];
    const obj = {};
    for (let j = 0; j < headers.length; j += 1) {
      obj[headers[j]] = values[j] ?? "";
    }
    out.push(obj);
  }
  return out;
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

function parseArgs(argv) {
  const args = {
    songsPath: "",
    transactionsPath: "",
    usersPath: "",
    apply: false,
    batchSizeSongs: 5,
    batchSizeTransactions: 100,
    noCreditAdjustments: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--songs") args.songsPath = argv[++i] || "";
    else if (token === "--transactions") args.transactionsPath = argv[++i] || "";
    else if (token === "--users") args.usersPath = argv[++i] || "";
    else if (token === "--apply") args.apply = true;
    else if (token === "--no-credit-adjustments") args.noCreditAdjustments = true;
    else if (token === "--batch-songs") args.batchSizeSongs = Number(argv[++i] || 100);
    else if (token === "--batch-transactions") args.batchSizeTransactions = Number(argv[++i] || 100);
  }

  if (!args.songsPath && !args.transactionsPath) {
    throw new Error("Provide at least one input: --songs <path> or --transactions <path>");
  }
  return args;
}

function mapSong(row) {
  let data = row.data && typeof row.data === "object" ? row.data : {};
  if (!data || !Object.keys(data).length) {
    const rawData = row.data;
    if (typeof rawData === "string" && rawData.trim().startsWith("{")) {
      try {
        data = JSON.parse(rawData);
      } catch (_) {
        data = {};
      }
    }
  }

  const createdRaw = row.createdAt || row.created_at || data.createdAt || data.created_at || undefined;
  const updatedRaw = row.updatedAt || row.updated_at || data.updatedAt || data.updated_at || createdRaw;
  const albumArtRaw = row.albumArt || row.album_art || data.albumArt || data.album_art || undefined;
  const albumArt = sanitizeAlbumArt(albumArtRaw);
  return {
    email: normalizeEmail(row.email || row.user_email || row.userEmail),
    title: String(row.title || data.title || "Untitled"),
    sunoPrompt: String(row.sunoPrompt || row.suno_prompt || data.sunoPrompt || data.suno_prompt || ""),
    lyrics: String(row.lyrics || data.lyrics || ""),
    albumArt,
    socialPack: row.socialPack || row.social_pack || data.socialPack || data.social_pack || undefined,
    createdAt: toEpochMs(createdRaw),
    updatedAt: toEpochMs(updatedRaw),
  };
}

function sanitizeAlbumArt(value) {
  if (!value) return undefined;
  const str = String(value);
  if (str.startsWith("data:image/")) return undefined;
  if (str.length > 20_000) return undefined;
  return str;
}

function mapTransaction(row, emailBySupabaseUserId) {
  const emailFromMap = row.user_id ? emailBySupabaseUserId.get(String(row.user_id)) : "";
  return {
    email: normalizeEmail(row.email || row.user_email || row.userEmail || emailFromMap),
    stripeSessionId: String(row.stripeSessionId || row.stripe_session_id || row.sessionId || row.session_id || ""),
    item: String(row.item || row.description || row.type || "Legacy Purchase"),
    amountCents: Number(row.amountCents ?? row.amount_cents ?? Math.round((Number(row.amount || 0) || 0) * 100)),
    creditsGranted: Number(row.creditsGranted ?? row.credits_granted ?? row.credits ?? 0),
    status: String(row.status || "completed"),
    createdAt: toEpochMs(row.createdAt || row.created_at || undefined),
  };
}

function toEpochMs(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const num = Number(value);
  if (Number.isFinite(num) && String(value).trim().match(/^\d+$/)) {
    if (num > 1_000_000_000_000) return num;
    if (num > 1_000_000_000) return num * 1000;
    return undefined;
  }
  let s = String(value).trim().replace(" ", "T");
  s = s.replace(/([+-]\d{2})$/, "$1:00");
  const t = Date.parse(s);
  return Number.isNaN(t) ? undefined : t;
}

function buildSupabaseUserMap(rawUsers) {
  const map = new Map();
  for (const row of rawUsers || []) {
    const id = String(row.id || row.user_id || "").trim();
    const email = normalizeEmail(row.email || row.user_email || "");
    if (id && email) map.set(id, email);
  }
  return map;
}

async function run() {
  const args = parseArgs(process.argv);

  const convexUrl = process.env.CONVEX_URL;
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY;
  if (!convexUrl || !convexAdminKey) {
    throw new Error("Missing CONVEX_URL or CONVEX_ADMIN_KEY in environment");
  }

  const rawSongs = args.songsPath ? readJsonOrCsv(args.songsPath) : [];
  const rawTransactions = args.transactionsPath ? readJsonOrCsv(args.transactionsPath) : [];
  const rawUsers = args.usersPath ? readJsonOrCsv(args.usersPath) : [];
  const emailBySupabaseUserId = buildSupabaseUserMap(rawUsers);

  const songs = rawSongs.map(mapSong).filter((row) => row.email && row.title && row.lyrics);
  const transactions = rawTransactions
    .map((row) => mapTransaction(row, emailBySupabaseUserId))
    .filter((row) => row.email && row.stripeSessionId);

  const client = new ConvexHttpClient(convexUrl);
  client.setAdminAuth(convexAdminKey);

  const songBatches = chunk(songs, Math.max(1, args.batchSizeSongs));
  const txBatches = chunk(transactions, Math.max(1, args.batchSizeTransactions));

  const totals = {
    dryRun: !args.apply,
    songsSeen: songs.length,
    songsInserted: 0,
    songsSkippedDuplicate: 0,
    songsMissingEmail: 0,
    transactionsSeen: transactions.length,
    transactionsInserted: 0,
    transactionsSkippedDuplicate: 0,
    creditsAdjustedUsers: 0,
    creditsTotalDelta: 0,
    usersTouched: 0,
    warnings: [],
  };

  for (let i = 0; i < songBatches.length; i += 1) {
    const res = await client.mutation(internal.app.backfillSupabaseData, {
      dryRun: !args.apply,
      songs: songBatches[i],
      applyCreditAdjustments: !args.noCreditAdjustments,
    });
    totals.songsInserted += res.songsInserted || 0;
    totals.songsSkippedDuplicate += res.songsSkippedDuplicate || 0;
    totals.songsMissingEmail += res.songsMissingEmail || 0;
    totals.usersTouched += res.usersTouched || 0;
    if (Array.isArray(res.warnings)) totals.warnings.push(...res.warnings);
    console.log(`[songs ${i + 1}/${songBatches.length}] inserted=${res.songsInserted} skipped=${res.songsSkippedDuplicate}`);
  }

  for (let i = 0; i < txBatches.length; i += 1) {
    const res = await client.mutation(internal.app.backfillSupabaseData, {
      dryRun: !args.apply,
      transactions: txBatches[i],
      applyCreditAdjustments: !args.noCreditAdjustments,
    });
    totals.transactionsInserted += res.transactionsInserted || 0;
    totals.transactionsSkippedDuplicate += res.transactionsSkippedDuplicate || 0;
    totals.creditsAdjustedUsers += res.creditsAdjustedUsers || 0;
    totals.creditsTotalDelta += res.creditsTotalDelta || 0;
    totals.usersTouched += res.usersTouched || 0;
    if (Array.isArray(res.warnings)) totals.warnings.push(...res.warnings);
    console.log(`[tx ${i + 1}/${txBatches.length}] inserted=${res.transactionsInserted} skipped=${res.transactionsSkippedDuplicate} creditDelta=${res.creditsTotalDelta}`);
  }

  console.log("\nBackfill complete");
  console.log(JSON.stringify(totals, null, 2));
  if (!args.apply) {
    console.log("\nDry run only. Re-run with --apply to write data.");
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
