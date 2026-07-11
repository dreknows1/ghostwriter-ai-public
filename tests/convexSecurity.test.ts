import { describe, it, expect } from "vitest";
import { upsertUserProfileByEmail, deleteSongById } from "../convex/app";
import { upsertUserCredentials } from "../convex/users";

/**
 * These exercise the Convex mutation handlers directly (via the `_handler` the
 * `mutation()` wrapper exposes) against a tiny in-memory `ctx.db`, so the C2/H1
 * object-level guarantees are proven without a live Convex deployment.
 */

type Row = Record<string, any> & { _id: string };

function makeDb(seed: Record<string, Row[]>) {
  const tables: Record<string, Row[]> = {};
  for (const [k, v] of Object.entries(seed)) tables[k] = v.map((r) => ({ ...r }));
  const log = { patch: [] as Array<{ id: string; obj: any }>, delete: [] as string[], insert: [] as Array<{ table: string; row: Row }> };
  let idc = 1;

  const db = {
    query(table: string) {
      let rows = (tables[table] || []).slice();
      const builder: any = {
        withIndex(_name: string, fn: (q: any) => any) {
          const conds: Array<[string, any]> = [];
          const qb: any = { eq: (f: string, val: any) => { conds.push([f, val]); return qb; } };
          fn(qb);
          rows = rows.filter((r) => conds.every(([f, val]) => r[f] === val));
          return builder;
        },
        order() { return builder; },
        filter() { return builder; },
        async first() { return rows[0] ?? null; },
        async collect() { return rows.slice(); },
        async take(n: number) { return rows.slice(0, n); },
      };
      return builder;
    },
    async get(id: string) {
      for (const t of Object.keys(tables)) {
        const found = (tables[t] || []).find((r) => r._id === id);
        if (found) return found;
      }
      return null;
    },
    async patch(id: string, obj: any) {
      log.patch.push({ id, obj });
      for (const t of Object.keys(tables)) {
        const row = (tables[t] || []).find((r) => r._id === id);
        if (row) Object.assign(row, obj);
      }
    },
    async delete(id: string) {
      log.delete.push(id);
      for (const t of Object.keys(tables)) tables[t] = (tables[t] || []).filter((r) => r._id !== id);
    },
    async insert(table: string, obj: any) {
      const _id = `${table}_${idc++}`;
      const row = { _id, ...obj };
      (tables[table] ||= []).push(row);
      log.insert.push({ table, row });
      return _id;
    },
  };
  return { db, log, tables };
}

const call = (fn: any, ctx: any, args: any) => (fn as any)._handler(ctx, args);

describe("C2 — upsertUserProfileByEmail ignores client-supplied credits", () => {
  it("a caller-supplied credits/last_reset_date is dropped; only presentational fields patch", async () => {
    const { db, log } = makeDb({
      users: [{ _id: "u1", email: "alice@example.com" }],
      profiles: [{ _id: "p1", userId: "u1", credits: 10, tier: "public", lastResetDate: "2026-01-01" }],
      skoolMembers: [],
    });

    await call(upsertUserProfileByEmail, { db }, {
      email: "alice@example.com",
      display_name: "Alice",
      credits: 999999, // attacker-supplied
      last_reset_date: "1999-01-01", // attacker-supplied
    });

    const profilePatch = log.patch.find((p) => p.id === "p1");
    expect(profilePatch).toBeTruthy();
    expect("credits" in profilePatch!.obj).toBe(false);
    expect("lastResetDate" in profilePatch!.obj).toBe(false);
    expect(profilePatch!.obj.displayName).toBe("Alice");
  });
});

describe("C1 — deleteSongById is ownership-checked", () => {
  it("refuses to delete a song owned by another user", async () => {
    const { db, log } = makeDb({
      users: [{ _id: "u1", email: "alice@example.com" }],
      profiles: [{ _id: "p1", userId: "u1", credits: 5, tier: "public" }],
      savedSongs: [{ _id: "s1", userId: "u2", title: "victim song" }],
    });

    await expect(call(deleteSongById, { db }, { songId: "s1", email: "alice@example.com" })).rejects.toThrow(
      /Not authorized/i
    );
    expect(log.delete).toHaveLength(0);
  });

  it("deletes a song the acting user owns", async () => {
    const { db, log } = makeDb({
      users: [{ _id: "u1", email: "alice@example.com" }],
      profiles: [{ _id: "p1", userId: "u1", credits: 5, tier: "public" }],
      savedSongs: [{ _id: "s1", userId: "u1", title: "my song" }],
    });

    const r = await call(deleteSongById, { db }, { songId: "s1", email: "alice@example.com" });
    expect(r).toEqual({ ok: true });
    expect(log.delete).toContain("s1");
  });
});

describe("H1 — upsertUserCredentials never attaches a password to an existing account", () => {
  it("an existing (passwordless) user is refreshed but gets NO passwordHash/passwordSalt", async () => {
    const { db, log } = makeDb({
      users: [{ _id: "u1", email: "alice@example.com", isActive: true }],
    });

    await call(upsertUserCredentials, { db }, {
      email: "alice@example.com",
      passwordHash: "attackerhash",
      passwordSalt: "attackersalt",
    });

    const patch = log.patch.find((p) => p.id === "u1");
    expect(patch).toBeTruthy();
    expect("passwordHash" in patch!.obj).toBe(false);
    expect("passwordSalt" in patch!.obj).toBe(false);
  });

  it("a net-new user may set a password at creation (legit signup still works)", async () => {
    const { db, tables } = makeDb({ users: [] });

    await call(upsertUserCredentials, { db }, {
      email: "new@example.com",
      passwordHash: "h",
      passwordSalt: "s",
    });

    const created = tables.users.find((u) => u.email === "new@example.com");
    expect(created?.passwordHash).toBe("h");
    expect(created?.passwordSalt).toBe("s");
  });
});
