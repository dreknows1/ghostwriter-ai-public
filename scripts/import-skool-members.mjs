#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { internal } from "../convex/_generated/api.js";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function parseCsvLine(line) {
  const out = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cell);
      cell = "";
    } else {
      cell += ch;
    }
  }
  out.push(cell);
  return out;
}

function parseCsv(raw) {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j += 1) row[headers[j]] = values[j] ?? "";
    rows.push(row);
  }
  return rows;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error("Usage: node scripts/import-skool-members.mjs <csv-path> [--apply]");
    process.exit(1);
  }

  const apply = process.argv.includes("--apply");
  const convexUrl = process.env.CONVEX_URL;
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY;
  if (!convexUrl || !convexAdminKey) {
    throw new Error("Missing CONVEX_URL or CONVEX_ADMIN_KEY");
  }

  const raw = fs.readFileSync(path.resolve(fileArg), "utf8");
  const rows = parseCsv(raw);
  const members = rows
    .map((row) => ({
      email: normalizeEmail(row.Email || row.Answer1 || row.email),
      firstName: String(row.FirstName || row.firstName || "").trim() || undefined,
      lastName: String(row.LastName || row.lastName || "").trim() || undefined,
      joinedDate: String(row.JoinedAt || row["Joined at"] || row.created_at || "").trim() || undefined,
    }))
    .filter((row) => row.email);

  const client = new ConvexHttpClient(convexUrl);
  client.setAdminAuth(convexAdminKey);

  const batches = chunk(members, 100);
  const totals = { apply, rows: members.length, inserted: 0, updated: 0, skippedNoEmail: 0 };
  for (let i = 0; i < batches.length; i += 1) {
    const res = await client.mutation(internal.app.upsertSkoolMembers, {
      dryRun: !apply,
      rows: batches[i],
    });
    totals.inserted += res.inserted || 0;
    totals.updated += res.updated || 0;
    totals.skippedNoEmail += res.skippedNoEmail || 0;
    console.log(`[${i + 1}/${batches.length}] inserted=${res.inserted} updated=${res.updated}`);
  }

  const enforceRes = await client.mutation(internal.app.enforceSkoolTiersFromMembers, {
    dryRun: !apply,
  });

  console.log(JSON.stringify({ totals, enforce: enforceRes }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
