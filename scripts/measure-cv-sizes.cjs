// Measures the real rendered height of every content-visibility block on
// math pages (the blocks katex-inline wraps: <p>, <h2>, <h3>, <ul>,
// <figure>, <pre> and katex-display spans) at the mobile and desktop
// audit widths, and records them in .cache/cv-sizes.json. katex-inline
// embeds those values as contain-intrinsic-size, so a block entering the
// rendering range never shifts the layout (zero CLS).
//
// run() is a SYNCHRONOUS afterBuild hook registered in .eleventy.js just
// before katex-inline. Eleventy runs its afterBuild listeners in parallel,
// so the async Chrome work happens in a worker thread
// (cv-measure-worker.cjs) while the main thread blocks on Atomics.wait —
// the remaining sync chain (katex-inline, compression) only starts
// after the table is up to date.
//
// Table format (per page; pageId is the dist-relative path with / -> __,
// .html and a trailing __index stripped):
//   {
//     "<pageId>": {
//     "hash": "<sha1 of the canonical page bytes: built page minus the katex-inline injection>",
//       "mobile": [heights in block order],
//       "desktop": [heights in block order]
//     }
//   }
// A page is re-measured only when its content hash or block count differs
// from the stored table (steady-state builds launch no Chrome); entries
// for math pages that no longer exist are garbage-collected. Everything
// degrades to the constant fallback (200px/120px in katex-inline) when
// Chrome or ws is unavailable.
//
// The browser scope + selector in cv-measure-worker.cjs MUST mirror
// cvScope + CV_BLOCK_RE in katex-inline.cjs; a mismatch shows up as a
// block-count mismatch and the page is skipped (previous entry kept).
//
// Usage: node scripts/measure-cv-sizes.cjs
//   (re)measure changed math pages against the built dist and persist
//   the table. A run against a production dist is a no-op when nothing
//   changed: the hash canonicalizes away katex-inline's injection,
//   matching the afterBuild hook's baseline.
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {Worker, isMainThread} = require('worker_threads');
const {pageIdOf, isMathPage, cvBlockCount} = require('./katex-inline.cjs');

const CHROME = process.env.CHROME_PATH || '/workspace/chrome/chrome-linux64/chrome';
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const OUT = path.join(root, '.cache', 'cv-sizes.json');

function loadTable() {
  try {
    const t = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    return t && typeof t === 'object' && !Array.isArray(t) ? t : {};
  } catch {
    return {};
  }
}

function isFresh(table, pageId, hash, n) {
  const e = table[pageId];
  if (!e || !e.hash || !Array.isArray(e.mobile) || !Array.isArray(e.desktop)) {
    return false;
  }
  if (e.hash !== hash) return false;
  if (e.mobile.length !== n || e.desktop.length !== n) return false;
  return true;
}

function walkHtml(dir) {
  const out = [];
  (function walk(d) {
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (name.endsWith('.html')) out.push(p);
    }
  })(dir);
  return out;
}

/**
 * Walk dist, diff the math pages against the stored table. Returns
 * { table, work }; work is empty when every math page is fresh (no Chrome
 * launch happens). GCs table entries for math pages that no longer exist.
 */
function plan() {
  const table = loadTable();
  const live = new Set();
  const work = [];
  for (const file of walkHtml(distDir)) {
    const raw = fs.readFileSync(file, 'utf8');
    if (!isMathPage(raw)) continue;
    // Canonical form: the page bytes the afterBuild hook hashed — the
    // fresh Eleventy output, before katex-inline's injection. This CLI
    // runs against a built dist (post-injection), so strip the injection
    // artifacts to hash the same bytes: the KaTeX subset style
    // (id="katex-inline"; older builds used a bare <style> right after
    // the global CSS), the cv-sizes style, and the data-cv attributes.
    // Without this, a standalone run would see a different hash and
    // re-measure on every invocation.
    const html = raw
      .replace(/<style id="katex-inline">[\s\S]*?<\/style>/g, '')
      .replace(
        /(<style id="global-css">[\s\S]*?<\/style>)<style>\.katex\{[\s\S]*?<\/style>/,
        '$1'
      )
      .replace(/<style id="cv-sizes">[\s\S]*<\/style>/g, '')
      .replace(/ data-cv="\d+"/g, '');
    const pageId = pageIdOf(file);
    live.add(pageId);
    const n = cvBlockCount(html);
    const hash = crypto.createHash('sha1').update(html).digest('hex');
    if (!isFresh(table, pageId, hash, n)) {
      work.push({file, pageId, hash, n});
    }
  }
  const gc = [];
  for (const pageId of Object.keys(table)) {
    if (!live.has(pageId)) {
      delete table[pageId];
      gc.push(pageId);
    }
  }
  return {table, work, gc};
}

function writeTable(table) {
  fs.mkdirSync(path.dirname(OUT), {recursive: true});
  fs.writeFileSync(OUT, JSON.stringify(table, null, 2) + '\n');
}

// ---------------------------------------------------------------------------
// Worker bridge: main thread blocks on Atomics.wait while the worker runs
// the async Chrome measurement. Returns { pageId: { mobile, desktop } } or
// null on failure.
// ---------------------------------------------------------------------------

function measureInWorker(work) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-measure-'));
  const out = path.join(dir, 'results.json');
  const sab = new SharedArrayBuffer(4);
  const worker = new Worker(path.join(__dirname, 'cv-measure-worker.cjs'), {
    workerData: {distDir, work, out, sab}
  });
  // Fatal worker errors cannot unblock us while Atomics.wait freezes the
  // main loop; the worker sets the flag on its own fatal path and the
  // timeout is the backstop.
  worker.on('error', () => {});
  const view = new Int32Array(sab);
  const deadline = Date.now() + 300_000;
  while (Atomics.load(view, 0) === 0 && Date.now() < deadline) {
    Atomics.wait(view, 0, 0, 1000);
  }
  worker.terminate();
  let results = null;
  try {
    const data = JSON.parse(fs.readFileSync(out, 'utf8'));
    if (data.ok) results = data.results;
    else console.warn('[cv] worker: ' + (data.error || 'unknown error'));
  } catch {
    console.warn('[cv] measurement timed out or produced no results');
  }
  fs.rmSync(dir, {recursive: true, force: true});
  return results;
}

// ---------------------------------------------------------------------------

/**
 * Synchronous afterBuild hook. Re-measures math pages whose content
 * changed, GCs deleted ones, and writes the table back. Never throws.
 */
function run() {
  try {
    if (!fs.existsSync(distDir)) {
      console.warn(
        `[cv] dist not found at ${distDir}; skipping content-visibility measurement`
      );
      return;
    }
    const {table, work, gc} = plan();
    if (work.length === 0) {
      // Steady state: nothing to measure, no Chrome launch. Still persist
      // the table when plan() GC'd entries for pages that no longer exist.
      if (gc.length > 0) {
        console.log(
          `[cv] garbage-collected ${gc.length} stale table entr${
            gc.length === 1 ? 'y' : 'ies'
          }: ${gc.join(', ')}`
        );
        writeTable(table);
      }
      return;
    }

    if (!fs.existsSync(CHROME)) {
      console.warn(
        `[cv] ${work.length} math page(s) need measuring but Chrome is missing at ${CHROME};` +
          ' keeping stored table (constants fallback where missing)'
      );
      writeTable(table);
      return;
    }

    console.log(`[cv] measuring ${work.length} math page(s) for content-visibility...`);
    const results = measureInWorker(work);
    if (!results) {
      console.warn('[cv] measurement failed; keeping stored table');
      writeTable(table);
      return;
    }
    for (const item of work) {
      const r = results[item.pageId];
      if (!r) {
        console.warn(`[cv]   ${item.pageId}: measurement failed; keeping previous entry`);
        continue;
      }
      if (r.mobile.length !== item.n || r.desktop.length !== item.n) {
        console.warn(
          `[cv]   ${item.pageId}: measured ${r.mobile.length}/${r.desktop.length} heights vs ` +
            `expected ${item.n} (selector drift?); skipping this page`
        );
        continue;
      }
      table[item.pageId] = {hash: item.hash, mobile: r.mobile, desktop: r.desktop};
      console.log(`[cv]   ${item.pageId}: ${item.n} blocks`);
    }
    writeTable(table);
  } catch (err) {
    console.warn(
      `[cv] content-visibility measurement failed: ${err.message}; ` +
        'falling back to the stored table'
    );
  }
}

if (isMainThread && require.main === module) {
  run();
}

module.exports = {run};
