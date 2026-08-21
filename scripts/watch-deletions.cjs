/*
 * Dev-only deletion watcher (run by `npm start` alongside `eleventy
 * --serve`). Eleventy's dev server rebuilds changed sources but never
 * removes output for sources that were deleted — its unlink handler only
 * drops the file from the search index — so a deleted post would keep
 * being served from dist/. This watcher removes the built output (plus
 * its .br/.gz siblings) when a source disappears, garbage-collects tag
 * pages whose last post was deleted, and forces one full serve rebuild
 * (identical-bytes site.json touch, same trigger as build-css.cjs --watch)
 * so the collection pages (home, /archive, feed.xml, sitemap.xml, /tags/
 * index) drop references to the deleted source.

 * Source -> output resolution mirrors this site's Eleventy behavior:
 * an explicit frontmatter `permalink` wins, otherwise the default
 * /<dir>/<name>/index.html. The one exception is src/tags.njk, whose
 * pagination expands to /tags/<tag>/ for every tag.
 *
 * Polling follows .eleventy.js: file events are silently dropped on
 * virtualized/network volumes (WSL2 9p, macOS iCloud/OneDrive/external
 * drives), so poll by default off-macOS. Override with ELEVENTY_POLL=1
 * (force polling) or ELEVENTY_POLL=0 (force events).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const slugify = require('slugify');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist');

const pollEnv = process.env.ELEVENTY_POLL;
const usePolling = pollEnv ? pollEnv === '1' : process.platform !== 'darwin';

// Same options as Eleventy's built-in `slug` filter (src/Filters/Slug.js),
// so /tags/<dir> names computed here match the built tag pages.
const tagSlug = (tag) => slugify(tag, { replacement: '-', lower: true });

// ---------------------------------------------------------------------------
// Source -> output resolution
// ---------------------------------------------------------------------------

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;
const STRIP_QUOTES = (s) => s.replace(/^["']|["']$/g, '');

/** `permalink` value from a file's frontmatter, or null. */
function frontmatterPermalink(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
  const fm = text.match(FRONTMATTER_RE);
  if (!fm) return null;
  const p = fm[1].match(/^permalink:\s*(.+?)\s*$/m);
  return p ? STRIP_QUOTES(p[1]) : null;
}

/**
 * Built output path (leading /, dist-relative) for a deleted source, or
 * null when the file produces no page (layouts, partials, _data, scss,
 * js, assets, …).
 *
 * @param {string} rel forward-slash path relative to src/
 */
function outputFor(rel) {
  if (
    rel.startsWith('layouts/') ||
    rel.startsWith('partials/') ||
    rel.startsWith('_') ||
    rel.startsWith('scss/') ||
    rel.startsWith('js/') ||
    rel.startsWith('assets/') ||
    rel.startsWith('fonts/') ||
    rel.startsWith('icons/')
  ) {
    return null;
  }
  // tags.njk paginates to /tags/<tag>/ per tag; handleUnlink handles it.
  if (rel === 'tags.njk') return null;
  const ext = path.posix.extname(rel);
  if (!['.md', '.njk', '.html'].includes(ext)) return null;
  const permalink = frontmatterPermalink(path.join(srcDir, rel));
  if (permalink !== null) {
    // Relative permalinks resolve against the source file's directory
    // (src/404.md → "404.html" → /404.html).
    return permalink.startsWith('/')
      ? permalink
      : '/' + path.posix.join(path.posix.dirname(rel), permalink);
  }
  return '/' + rel.slice(0, -ext.length) + '/index.html';
}

// ---------------------------------------------------------------------------
// Tag pages
// ---------------------------------------------------------------------------

/**
 * Slugs of the tags a tag page could exist for: every tag carried by any
 * file in src/posts/, mirroring tags.njk's pagination over the (unfiltered)
 * tag collections. Date/draft don't matter — a future or draft post still
 * occupies its tag collection, so its tag page is built.
 */
function liveTagSlugs() {
  const slugs = new Set();
  const postsDir = path.join(srcDir, 'posts');
  let names = [];
  try {
    names = fs.readdirSync(postsDir);
  } catch {
    return slugs;
  }
  for (const name of names) {
    if (!name.endsWith('.md')) continue;
    let text;
    try {
      text = fs.readFileSync(path.join(postsDir, name), 'utf8');
    } catch {
      continue;
    }
    const fm = text.match(FRONTMATTER_RE);
    if (!fm) continue;
    // Block-style lists only (the repo convention):
    //   tags:
    //     - foo
    const tags = fm[1].match(/^tags:\r?\n((?:[ \t]+-[ \t]*.+\r?\n?)+)/m);
    if (!tags) continue;
    for (const line of tags[1].split(/\r?\n/)) {
      const item = line.match(/^[ \t]+-[ \t]*(.+?)\s*$/);
      if (!item) continue;
      const tag = STRIP_QUOTES(item[1]);
      if (!tag || tag === 'post' || tag === 'page') continue;
      slugs.add(tagSlug(tag));
    }
  }
  return slugs;
}

/** Remove /tags/<t>/ for tags no remaining post carries. */
function gcOrphanTagPages() {
  const tagsDir = path.join(distDir, 'tags');
  let names = [];
  try {
    names = fs.readdirSync(tagsDir);
  } catch {
    return;
  }
  const live = liveTagSlugs();
  for (const name of names) {
    const dir = path.join(tagsDir, name);
    try {
      if (!fs.statSync(dir).isDirectory()) continue; // keep /tags/index.html
    } catch {
      continue;
    }
    if (live.has(name)) continue;
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`[deletions] removed orphaned tag page /tags/${name}/`);
  }
}

// ---------------------------------------------------------------------------
// Deletion
// ---------------------------------------------------------------------------

function removeOutput(out) {
  const target = path.join(distDir, out);
  let stat = null;
  try {
    stat = fs.statSync(target);
  } catch {
    return;
  }
  if (stat.isDirectory()) {
    fs.rmSync(target, { recursive: true, force: true });
  } else {
    for (const suffix of ['', '.br', '.gz']) {
      fs.rmSync(target + suffix, { force: true });
    }
    // /<...>/index.html pages live in their own directory; drop it once
    // empty. rmdirSync only succeeds on an empty dir, so a page that
    // kept other files (or a shared parent like dist/posts) is left
    // alone; never rmdir dist/ itself.
    if (out.endsWith('/index.html')) {
      const parent = path.dirname(target);
      const rel = path.relative(distDir, parent);
      if (rel && !rel.startsWith('..')) {
        try {
          fs.rmdirSync(parent);
        } catch {
          // Not empty or already gone: leave it.
        }
      }
    }
  }
  console.log(`[deletions] removed ${out}`);
}

// ---------------------------------------------------------------------------
// Serve rebuild trigger
// ---------------------------------------------------------------------------

// Eleventy's --serve watcher un-watches a deleted source but does not
// rebuild for it, so the collection pages (home, /archive, feed.xml,
// sitemap.xml, /tags/ index) keep referencing the deleted post until
// something else triggers a build. Rewriting site.json with identical
// bytes (mtime-only) is the proven trigger — the same pattern
// build-css.cjs --watch uses. Debounced: a burst of deletions collapses
// into one rebuild.
let rebuildTimer = null;
function requestRebuild() {
  if (rebuildTimer) return;
  rebuildTimer = setTimeout(() => {
    rebuildTimer = null;
    const siteFile = path.join(srcDir, '_data', 'site.json');
    try {
      fs.writeFileSync(siteFile, fs.readFileSync(siteFile));
      console.log('[deletions] requesting full serve rebuild (site.json touch)');
    } catch (err) {
      console.warn(`[deletions] rebuild touch failed: ${err.message}`);
    }
  }, 300);
}

function handleUnlink(file) {
  const rel = path.relative(srcDir, file).split(path.sep).join('/');
  if (!rel || rel.startsWith('..')) return;

  if (rel === 'tags.njk') {
    // The per-tag template is gone: every /tags/<t>/ page is stale, but
    // the /tags/ index (tagList.njk) is not.
    const tagsDir = path.join(distDir, 'tags');
    let names = [];
    try {
      names = fs.readdirSync(tagsDir);
    } catch {
      return;
    }
    for (const name of names) {
      const dir = path.join(tagsDir, name);
      try {
        if (!fs.statSync(dir).isDirectory()) continue;
      } catch {
        continue;
      }
      fs.rmSync(dir, { recursive: true, force: true });
    }
    console.log('[deletions] removed /tags/* (tags.njk deleted)');
    return;
  }

  const isPost = rel.startsWith('posts/') && rel.endsWith('.md');
  const out = outputFor(rel);
  if (out) {
    removeOutput(out);
    // The source produced a page: force one full serve rebuild so the
    // collection pages stop referencing the deleted source.
    requestRebuild();
  }
  if (isPost) gcOrphanTagPages();
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

module.exports = { outputFor, liveTagSlugs, removeOutput, gcOrphanTagPages, handleUnlink };

if (require.main === module) {
  const watcher = chokidar.watch(srcDir, {
    ignoreInitial: true,
    usePolling: usePolling,
    interval: usePolling ? 300 : undefined,
  });

  watcher.on('unlink', handleUnlink);
  watcher.on('error', (err) => console.warn(`[deletions] watcher error: ${err.message}`));
  watcher.on('ready', () => {
    console.log(`[deletions] watching src/ (${usePolling ? 'polling' : 'events'})`);
  });
}
