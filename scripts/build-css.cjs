/*
 * CSS build pipeline
 *
 * 1. Regenerate SCSS design tokens from src/_data/tokens.json (json-to-scss).
 * 2. Compile src/scss/global.scss with sass (compressed).
 * 3. Publish the hash + full content + source mtime to .cache/css-build.json
 *    (gitignored build output); the base layout inlines the CSS so pages
 *    make no render-blocking CSS request.
 *
 * The build is idempotent and content-addressed: re-running with unchanged
 * sources produces the same hash and is skipped.
 *
 * Usage:
 *   node scripts/build-css.cjs            # one-shot build (no-op if fresh)
 *   node scripts/build-css.cjs --watch    # build, then rebuild on source change
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {execFileSync} = require('child_process');

const root = path.resolve(__dirname, '..');
const scssDir = path.join(root, 'src', 'scss');
const tokensFile = path.join(root, 'src', '_data', 'tokens.json');
const entryFile = path.join(scssDir, 'global.scss');
const dataFile = path.join(root, '.cache', 'css-build.json');

const hashOf = css =>
  crypto
    .createHash('sha256')
    .update(css)
    .digest('hex')
    .slice(0, 10);
const cssName = hash => `global.${hash}.css`;

function newestSourceMtime() {
  let newest = 0;
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else newest = Math.max(newest, fs.statSync(full).mtimeMs);
    }
  };
  if (fs.existsSync(scssDir)) visit(scssDir);
  if (fs.existsSync(tokensFile))
    newest = Math.max(newest, fs.statSync(tokensFile).mtimeMs);
  return newest;
}

function readRecord() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch {
    return null; // missing or corrupt record: treat as not built
  }
}

function currentHash() {
  const record = readRecord();
  return record && record.hash ? record.hash : null;
}

/** True when the record is missing or older than its sources. */
function isStale() {
  const record = readRecord();
  if (!record || typeof record.content !== 'string' || !record.content) {
    return true;
  }
  return (record.sourceMtime || 0) < newestSourceMtime();
}

/** Compile tokens + scss and publish the build record. */
function build() {
  // 1. Tokens
  execFileSync(
    process.execPath,
    [
      path.join(root, 'node_modules', 'json-to-scss', 'bin', 'cli.js'),
      tokensFile,
      path.join(scssDir, '_tokens.scss')
    ],
    {cwd: root, stdio: 'pipe'}
  );

  // 2. Compile
  // Lazy require: sass is a few hundred ms to load and not needed in watch
  // no-op checks.
  const sass = require('sass');
  const result = sass.compile(entryFile, {style: 'compressed'});
  const css = result.css;

  // 3. Publish the record (hash + full content + source mtime; the base
  // layout inlines the CSS so pages make no render-blocking CSS request).
  // Only rewrite when the CSS actually changed, to avoid needless
  // rebuilds.
  const hash = hashOf(css);
  const sourceMtime = newestSourceMtime();
  const prev = readRecord();
  if (prev && prev.content === css && (prev.sourceMtime || 0) >= sourceMtime) {
    return prev.hash || hash;
  }
  fs.mkdirSync(path.dirname(dataFile), {recursive: true});
  fs.writeFileSync(dataFile, JSON.stringify({hash, content: css, sourceMtime}) + '\n');
  return hash;
}

function ensureBuilt() {
  if (isStale()) {
    const hash = build();
    console.log(`[css] built ${cssName(hash)}`);
  }
  return !isStale();
}

// Eleventy's watcher honors .gitignore, so a rebuild of the gitignored
// .cache/css-build.json cannot trigger a page rebuild by itself. Rewriting
// site.json with identical bytes (mtime-only) is the trigger: pages inline
// the CSS from css-build.json, and the rebuild Eleventy starts for the
// edited source may read the CSS record before this build has finished.
function touchEleventy() {
  const siteFile = path.join(root, 'src', '_data', 'site.json');
  try {
    fs.writeFileSync(siteFile, fs.readFileSync(siteFile));
  } catch (err) {
    console.warn(`[css] serve-rebuild trigger failed: ${err.message}`);
  }
}

/** Watch sources and rebuild on change.
 *
 * Polls source mtimes instead of using fs.watch: file-event APIs silently
 * deliver no events on virtualized/network filesystems (e.g. WSL2 v9fs),
 * while stat() always works. The scan covers a few dozen files, so a
 * 500ms interval is cheap on every platform.
 */
function watch() {
  let lastMtime = newestSourceMtime();
  setInterval(() => {
    const mtime = newestSourceMtime();
    if (mtime === lastMtime) return;
    lastMtime = mtime;
    try {
      if (isStale()) {
        const prevHash = currentHash();
        const hash = build();
        console.log(`[css] rebuilt ${cssName(hash)}`);
        if (hash !== prevHash) touchEleventy();
      }
    } catch (err) {
      console.error(`[css] build failed: ${err.message}`);
    }
  }, 500);
  console.log('[css] watching src/ for changes (mtime polling)');
}

module.exports = {build, ensureBuilt, isStale, watch};

if (require.main === module) {
  const mode = process.argv[2];
  try {
    if (mode === '--watch') {
      ensureBuilt();
      watch();
    } else {
      ensureBuilt();
    }
  } catch (err) {
    console.error(`[css] ${err.message}`);
    process.exit(1);
  }
}
