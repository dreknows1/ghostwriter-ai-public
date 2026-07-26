#!/usr/bin/env node
/**
 * Composes the deployable site from two independent pieces:
 *
 *   dist/     the Vite SPA, built exactly as it always was
 *   landing/  the static marketing page (hand-written HTML/CSS/JS + media)
 *
 * into site/, which is what Vercel serves:
 *
 *   site/index.html      landing page          -> songghost.com
 *   site/app/index.html  the SPA               -> songghost.com/app
 *   site/assets/*        the SPA's JS/CSS chunks (referenced absolutely, so
 *                        serving index.html from /app/ still resolves them)
 *
 * Why not just build the SPA with base:'/app/'? Because dist/ is also the
 * Capacitor webDir for the iOS app, where the bundle is loaded from the
 * capacitor:// scheme at the root. Rebasing would break iOS, and shipping the
 * landing page's video into the app bundle would bloat it for no reason.
 * Keeping the two trees separate and composing them here leaves the iOS build
 * byte-for-byte unchanged.
 */
import { cp, mkdir, rename, rm, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const landing = path.join(root, 'landing');
const site = path.join(root, 'site');

const fail = (msg) => {
  console.error(`\n[build-site] ${msg}\n`);
  process.exit(1);
};

if (!existsSync(dist)) fail('dist/ not found — run `vite build` before this script.');
if (!existsSync(path.join(dist, 'index.html'))) fail('dist/index.html not found — the Vite build did not produce an entry point.');
if (!existsSync(path.join(landing, 'index.html'))) fail('landing/index.html not found — the marketing page is missing.');

await rm(site, { recursive: true, force: true });

// 1. The whole SPA build, verbatim.
await cp(dist, site, { recursive: true });

// 2. Move its entry point under /app/ so the root is free for the landing page.
await mkdir(path.join(site, 'app'), { recursive: true });
await rename(path.join(site, 'index.html'), path.join(site, 'app', 'index.html'));

// 3. Lay the marketing page over the top. landing/ owns index.html and its own
//    asset folders (media/, fonts/); it must never contain an `assets/` dir,
//    which would collide with Vite's hashed chunks.
if (existsSync(path.join(landing, 'assets'))) {
  fail('landing/assets/ collides with the Vite build output — rename it (media/ or fonts/).');
}
await cp(landing, site, { recursive: true });

const bytes = async (dir) => {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    total += entry.isDirectory() ? await bytes(p) : (await stat(p)).size;
  }
  return total;
};

const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;
console.log(`[build-site] site/ composed — ${mb(await bytes(site))} total`);
console.log('[build-site]   /      -> landing page');
console.log('[build-site]   /app   -> SPA');
