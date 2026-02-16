#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { internal } from "../convex/_generated/api.js";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j += 1) {
      row[headers[j]] = cells[j] ?? "";
    }
    rows.push(row);
  }
  return rows;
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

async function main() {
  const csvPathArg = process.argv[2];
  if (!csvPathArg) {
    console.error("Usage: node scripts/relink-skool-songs.mjs <csv-path> [--apply]");
    process.exit(1);
  }

  const apply = process.argv.includes("--apply");
  const csvPath = path.resolve(csvPathArg);
  const csvRaw = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(csvRaw);

  const grouped = new Map();
  for (const row of rows) {
    const emailA = normalizeEmail(row.Email);
    const emailB = normalizeEmail(row.Answer1);
    const primaryEmail = emailB || emailA;
    if (!primaryEmail) continue;
    if (!grouped.has(primaryEmail)) grouped.set(primaryEmail, new Set());
    const aliases = grouped.get(primaryEmail);
    if (emailA) aliases.add(emailA);
    if (emailB) aliases.add(emailB);
  }

  const mappings = Array.from(grouped.entries()).map(([primaryEmail, aliases]) => ({
    primaryEmail,
    aliasEmails: Array.from(aliases),
  }));

  const convexUrl = process.env.CONVEX_URL;
  const adminKey = process.env.CONVEX_ADMIN_KEY;

  if (!convexUrl || !adminKey) {
    console.error("Missing CONVEX_URL or CONVEX_ADMIN_KEY in environment.");
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);
  client.setAdminAuth(adminKey);

  const batches = chunk(mappings, 25);
  const totals = {
    mappingsProcessed: 0,
    primaryUsersResolved: 0,
    aliasUsersResolved: 0,
    songsRelinked: 0,
    aliasesNotFound: 0,
  };

  for (let i = 0; i < batches.length; i += 1) {
    const res = await client.mutation(internal.app.relinkSongsByEmailAliases, {
      dryRun: !apply,
      mappings: batches[i],
    });
    totals.mappingsProcessed += res.mappingsProcessed || 0;
    totals.primaryUsersResolved += res.primaryUsersResolved || 0;
    totals.aliasUsersResolved += res.aliasUsersResolved || 0;
    totals.songsRelinked += res.songsRelinked || 0;
    totals.aliasesNotFound += res.aliasesNotFound || 0;
    console.log(
      `[${i + 1}/${batches.length}] dryRun=${res.dryRun} mappings=${res.mappingsProcessed} relinked=${res.songsRelinked}`
    );
  }

  console.log("\nDone.");
  console.log(JSON.stringify({ apply, totals }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
