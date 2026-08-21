/**
 * Fetch YouTube video thumbnails (hqdefault.jpg, 480x360) for every video
 * embedded via eleventy-plugin-youtube-embed, convert them to WebP
 * (quality 80 — the same encoder settings the regular eleventy-img pipeline
 * uses) and cache them under .cache/yt/<id>.webp. The build is otherwise
 * offline: an existing cache file is never re-fetched, and a failed
 * download leaves the remote i.ytimg.com URL in place (see the
 * localizeYtThumbnails transform).
 *
 * The 480x360 poster is displayed at up to ~720px wide, so the small source
 * resolution is a soft cap; the WebP encoding is what removes the ~2-3x
 * payload of the original JPEGs.
 *
 * One-time migration: legacy .cache/yt/<id>.jpg files are converted in
 * place and removed (from the cache and from dist/assets/images/yt), so a
 * mixed-format cache cannot ship stale bytes.
 *
 * Cached files are served from /assets/images/yt (passthrough copy) and
 * referenced by the transform instead of the remote URL.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CACHE_DIR = path.join(__dirname, '..', '.cache', 'yt');
const DIST_YT_DIR = path.join(__dirname, '..', 'dist', 'assets', 'images', 'yt');
const WEBP_QUALITY = 80;
const YT_ID = /[A-Za-z0-9-_]{11}/;
const YT_URL = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9-_]{11})/g;

function collectVideoIds() {
  const ids = new Set();
  const root = path.join(__dirname, '..', 'src');
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(md|njk|html)$/.test(entry.name)) continue;
      const text = fs.readFileSync(full, 'utf8');
      for (const match of text.matchAll(YT_URL)) {
        if (YT_ID.test(match[1])) ids.add(match[1]);
      }
    }
  };
  walk(root);
  return [...ids];
}

async function fetchOne(id) {
  const dest = path.join(CACHE_DIR, `${id}.webp`);
  const res = await fetch(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error('suspiciously small response');
  const webp = await sharp(buf).webp({ quality: WEBP_QUALITY }).toBuffer();
  fs.writeFileSync(dest, webp);
}

/** Convert legacy <id>.jpg cache entries to WebP and drop the JPEGs. */
async function migrateLegacyJpegs() {
  if (!fs.existsSync(CACHE_DIR)) return;
  for (const file of fs.readdirSync(CACHE_DIR)) {
    if (!file.endsWith('.jpg')) continue;
    const id = file.slice(0, -4);
    const dest = path.join(CACHE_DIR, `${id}.webp`);
    if (!fs.existsSync(dest)) {
      try {
        await sharp(path.join(CACHE_DIR, file))
          .webp({ quality: WEBP_QUALITY })
          .toFile(dest);
      } catch (err) {
        // Keep the JPEG for the next build; the page falls back to the
        // remote URL (the transform only localizes when the webp exists).
        console.warn(`[yt-thumbnails] migrating ${file}: ${err.message}`);
        continue;
      }
    }
    fs.rmSync(path.join(CACHE_DIR, file), { force: true });
    if (fs.existsSync(DIST_YT_DIR)) {
      fs.rmSync(path.join(DIST_YT_DIR, file), { force: true });
    }
  }
}

module.exports = async function fetchYtThumbnails() {
  await migrateLegacyJpegs();
  const ids = collectVideoIds();
  if (ids.length === 0) return 0;
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const missing = ids.filter(id => !fs.existsSync(path.join(CACHE_DIR, `${id}.webp`)));
  let fetched = 0;
  for (const id of missing) {
    try {
      await fetchOne(id);
      fetched++;
      console.log(`[yt-thumbnails] cached ${id}.webp`);
    } catch (err) {
      console.warn(`[yt-thumbnails] ${id}: ${err.message} — keeping remote URL`);
    }
  }
  console.log(`[yt-thumbnails] ${ids.length} video(s), ${fetched} fetched, ${ids.length - missing.length} cached`);
  return fetched;
};

// Run directly: `node scripts/fetch-yt-thumbnails.cjs`
if (require.main === module) {
  fetchYtThumbnails().catch(err => { console.error(err); process.exit(1); });
}
