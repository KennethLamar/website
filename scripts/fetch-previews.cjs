/*
 * Link preview fetcher
 *
 * Collects the URLs used with the `linkPreview` filter in src/posts/*.md,
 * fetches each page, extracts metadata with metascraper, and writes
 * .cache/link-previews.json (gitignored; refetched on a fresh clone).
 *
 * Preview images and logos are also downloaded into the build cache
 * (.cache/previews/, content-addressed); the Eleventy config copies them
 * into the output as /assets/images/previews/. Card images are converted
 * to WebP at 2x content width; logos keep their original bytes. The JSON
 * stores local paths plus natural dimensions and the original remote URL
 * (imageSource / logoSource / logoFaviconSource), so a cold checkout can
 * re-download the same files without re-scraping the pages.
 *
 * Two modes:
 * - refresh (default, `npm run fetch:previews`): re-fetch metadata for
 *   every referenced URL and re-download every preview image. Run after
 *   adding new external links or to update stale titles/descriptions.
 * - build ({ refresh: false }): called from the Eleventy config before
 *   every build. Fetches only URLs without an entry yet and re-downloads
 *   only cache files that are missing (cold checkout), so a fresh clone
 *   builds a complete site, and a warm build stays fully offline and
 *   rewrites nothing. Failures never fail the build: the filter falls
 *   back to the cached entry or a plain link.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const metascraper = require('metascraper')([
  require('metascraper-youtube')(),
  require('metascraper-amazon')(),
  require('metascraper-spotify')(),
  require('metascraper-soundcloud')(),
  require('metascraper-title')(),
  require('metascraper-url')(),
  require('metascraper-author')(),
  require('metascraper-date')(),
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-logo')(),
  require('metascraper-logo-favicon')(),
  require('metascraper-publisher')(),
  require('metascraper-clearbit')(),
]);

const root = path.resolve(__dirname, '..');
const postsDir = path.join(root, 'src', 'posts');
const outFile = path.join(root, '.cache', 'link-previews.json');
const previewsDir = path.join(root, '.cache', 'previews');

function collectUrls() {
  const urls = new Set();
  for (const file of fs.readdirSync(postsDir)) {
    if (!file.endsWith('.md')) continue;
    const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
    // {"https://example.com" | linkPreview ...}
    for (const m of content.matchAll(/"([^"]+)"\s*\|\s*linkPreview/g)) {
      urls.add(m[1]);
    }
  }
  return urls;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; HyliaLinkPreview/1.0)',
      accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { html: await res.text(), url: res.url };
}

function pick(meta) {
  return {
    title: meta.title || '',
    description: meta.description || '',
    image: meta.image || '',
    logo: meta.logo || '',
    logoFavicon: meta.logoFavicon || '',
    publisher: meta.publisher || '',
    author: meta.author || '',
  };
}

// Card images are displayed up to 52rem (832px) wide inside .inner-wrapper;
// encode at 2x so retina screens stay crisp without upscaling.
const CARD_IMAGE_WIDTH = 1664;

const EXT_BY_TYPE = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
};

async function fetchImage(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
    headers: {
      // Browser-like: some hosts 403 the metascraper UA on image CDNs.
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      accept: 'image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const type = (res.headers.get('content-type') || '').split(';')[0].trim();
  const ext =
    EXT_BY_TYPE[type] ||
    path.extname(new URL(res.url).pathname) ||
    '.bin';
  return { buf, ext };
}

/**
 * Download an entry's remote images into .cache/previews/ and rewrite the
 * entry to local paths with natural dimensions. Failures keep the original
 * remote URL (the previous behavior). The remote source is recorded next
 * to each local path (*Source) so a cold build can refill the cache.
 */
async function localizeEntry(entry, label) {
  fs.mkdirSync(previewsDir, { recursive: true });

  if (entry.image && /^https?:\/\//.test(entry.image)) {
    entry.imageSource = entry.image;
    try {
      const { buf } = await fetchImage(entry.image);
      const meta = await sharp(buf).metadata();
      const name = `${crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16)}.webp`;
      await sharp(buf)
        .resize({ width: CARD_IMAGE_WIDTH, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(previewsDir, name));
      entry.image = `/assets/images/previews/${name}`;
      entry.imageWidth = meta.width;
      entry.imageHeight = meta.height;
      console.log(`[previews] img  ${label} -> ${entry.image} (${meta.width}x${meta.height})`);
    } catch (err) {
      console.warn(`[previews] img FAIL ${label}: ${err.message} (keeping remote URL)`);
    }
  }

  for (const field of ['logo', 'logoFavicon']) {
    if (!entry[field] || !/^https?:\/\//.test(entry[field])) continue;
    entry[`${field}Source`] = entry[field];
    try {
      const { buf, ext } = await fetchImage(entry[field]);
      const name = `${crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16)}${ext}`;
      fs.writeFileSync(path.join(previewsDir, name), buf);
      entry[field] = `/assets/images/previews/${name}`;
      try {
        const meta = await sharp(buf).metadata();
        if (meta.width) {
          entry[`${field}Width`] = meta.width;
          entry[`${field}Height`] = meta.height;
        }
      } catch {
        // Not decodable by sharp (rare); omit dimensions.
      }
      console.log(`[previews] logo ${label} -> ${entry[field]}`);
    } catch (err) {
      console.warn(`[previews] logo FAIL ${label}: ${err.message} (keeping remote URL)`);
    }
  }
}

/**
 * Refill .cache/previews/ files that an existing entry points at but that
 * are missing (cold checkout: the cache is gitignored). Re-downloads the
 * recorded source URL and verifies the content-addressed filename matches
 * the JSON; a mismatch means upstream changed the image since the last
 * refresh, which `npm run fetch:previews` resolves.
 */
async function healEntry(entry, label) {
  fs.mkdirSync(previewsDir, { recursive: true });
  for (const field of ['image', 'logo', 'logoFavicon']) {
    const local = entry[field];
    if (!local || !local.startsWith('/assets/images/previews/')) continue;
    if (fs.existsSync(path.join(previewsDir, path.basename(local)))) continue;
    const source = entry[`${field}Source`];
    if (!source) {
      console.warn(
        `[previews] ${label}: ${local} missing from .cache/previews and no source recorded; run \`npm run fetch:previews\``
      );
      continue;
    }
    try {
      const { buf, ext } = await fetchImage(source);
      const sha = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16);
      const name = field === 'image' ? `${sha}.webp` : `${sha}${ext}`;
      if (name !== path.basename(local)) {
        console.warn(
          `[previews] ${label}: ${source} no longer serves ${path.basename(local)} (got ${name}); run \`npm run fetch:previews\``
        );
        continue;
      }
      if (field === 'image') {
        await sharp(buf)
          .resize({ width: CARD_IMAGE_WIDTH, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(path.join(previewsDir, name));
      } else {
        fs.writeFileSync(path.join(previewsDir, name), buf);
      }
      console.log(`[previews] refill ${label} -> ${local}`);
    } catch (err) {
      console.warn(`[previews] refill FAIL ${label}: ${err.message}`);
    }
  }
}

async function fetchLinkPreviews({ refresh = true } = {}) {
  const urls = collectUrls();
  if (!urls.size) {
    console.log('[previews] no linkPreview URLs found in posts');
  }

  const existing = fs.existsSync(outFile)
    ? JSON.parse(fs.readFileSync(outFile, 'utf8'))
    : {};
  const before = JSON.stringify(existing);

  for (const url of urls) {
    if (!refresh && existing[url]) {
      // Entry already cached: only refill missing cache files.
      await healEntry(existing[url], url);
      continue;
    }
    try {
      const { html, url: finalUrl } = await fetchHtml(url);
      const meta = await metascraper({ html, url: finalUrl });
      existing[url] = pick(meta);
      console.log(`[previews] ok   ${url} -> ${meta.title || '(no title)'}`);
    } catch (err) {
      console.warn(`[previews] FAIL ${url}: ${err.message}`);
      if (existing[url]) console.warn('[previews]        keeping previous entry');
    }
  }

  // Drop entries for URLs that are no longer referenced.
  for (const key of Object.keys(existing)) {
    if (!urls.has(key)) {
      delete existing[key];
      console.log(`[previews] removed ${key}`);
    }
  }

  // Localize every entry's remote images (idempotent: local paths are
  // skipped). Runs after the drop pass so only referenced entries are kept.
  for (const [url, entry] of Object.entries(existing)) {
    await localizeEntry(entry, url);
  }

  if (JSON.stringify(existing) !== before) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(existing, null, 2) + '\n');
    console.log(`[previews] wrote ${path.relative(root, outFile)}`);
  }
}

module.exports = fetchLinkPreviews;

// Run directly: `node scripts/fetch-previews.cjs`
if (require.main === module) {
  fetchLinkPreviews({ refresh: true }).catch((err) => {
    console.error(`[previews] ${err.stack || err.message}`);
    process.exit(1);
  });
}
