const rssPlugin = require('@11ty/eleventy-plugin-rss');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const embedYouTube = require('eleventy-plugin-youtube-embed');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// Import filters
const dateFilter = require('./src/filters/date-filter.js');
const markdownFilter = require('./src/filters/markdown-filter.js');
const w3DateFilter = require('./src/filters/w3-date-filter.js');
const linkPreviewFilter = require('./src/filters/link-preview-filter.js');

// Import transforms
const htmlMinTransform = require('./src/transforms/html-min-transform.js');
const parseTransform = require('./src/transforms/parse-transform.js');

// Import data files
const site = require('./src/_data/site.json');

// Ensure the CSS build record (.cache/css-build.json) exists before data
// loading - base.njk reads it via the cssBuild global. A no-op when fresh.
require('./scripts/build-css.cjs').ensureBuilt();

module.exports = function(config) {
  // Filters
  config.addFilter('dateFilter', dateFilter);
  config.addFilter('markdownFilter', markdownFilter);
  config.addFilter('w3DateFilter', w3DateFilter);
  config.addFilter('linkPreview', linkPreviewFilter);
  // Make root-relative URLs absolute — RSS feed only (see
  // src/filters/absolute-filter.js).
  config.addFilter('absoluteize', require('./src/filters/absolute-filter.js'));

  // Layout aliases
  config.addLayoutAlias('home', 'layouts/home.njk');

  // Shared markdown engine (post bodies + markdown filters); see
  // src/utils/markdown.js for the rule configuration.
  config.setLibrary('md', require('./src/utils/markdown.js').markdown);

  // Transforms
  config.addTransform('htmlmin', htmlMinTransform);
  config.addTransform('parse', parseTransform);
  // The afterBuild hooks below (image GC -> purge -> measure ->
  // katex-inline -> compression) each read and write the same dist files
  // and depend on registration order; Eleventy's default event mode runs
  // listeners in parallel, which races the read-modify-write passes.
  config.setEventEmitterMode('sequential');

  // File-change events (inotify/FSEvents) can silently deliver nothing on
  // virtualized/network/synced volumes (e.g. WSL2's 9p drvfs, macOS
  // iCloud/OneDrive/external drives), which leaves --serve unable to
  // detect edits. Poll by default everywhere except macOS, where FSEvents
  // is reliable on local volumes. Override with ELEVENTY_POLL=1 (force
  // polling) or ELEVENTY_POLL=0 (force events) on any platform. Dev-only:
  // production builds never start the watcher.
  const pollEnv = process.env.ELEVENTY_POLL;
  const usePolling = pollEnv ? pollEnv === '1' : process.platform !== 'darwin';
  if (usePolling) {
    config.setChokidarConfig({usePolling: true, interval: 300});
  }

  // Passthrough copy
  config.addPassthroughCopy('src/fonts');
  config.addPassthroughCopy('src/assets');
  config.addPassthroughCopy('src/js');
  config.addPassthroughCopy('src/files');
  config.addPassthroughCopy('src/ai');
  config.addPassthroughCopy('src/admin/config.yml');
  config.addPassthroughCopy('src/admin/previews.js');
  config.addPassthroughCopy('node_modules/nunjucks/browser/nunjucks-slim.js');
  config.addPassthroughCopy('src/robots.txt');
  config.addPassthroughCopy('src/_headers');
  // The compiled stylesheet is published to .cache/css-build.json (gitignored
  // build output) by scripts/build-css.cjs (run above, before data loading).
  // Read via addGlobalData so the layout can inline the content
  // (cssBuild.content).
  config.addGlobalData('cssBuild', () =>
    JSON.parse(fs.readFileSync(path.join(__dirname, '.cache', 'css-build.json'), 'utf8'))
  );
  // KaTeX CSS + fonts, served from /assets/katex (referenced by base.njk).
  config.addPassthroughCopy({'node_modules/katex/dist': 'assets/katex'});

  // Sync generated image variants into dist, then prune cache variants no
  // longer referenced by any built page (e.g. after an image is removed).
  config.on('afterBuild', () => {
    const cacheDir = path.join(__dirname, '.cache', 'images');
    try {
      if (fs.existsSync(cacheDir)) {
        // Content-addressed names: existing files are byte-identical, so
        // never overwrite. Per-file read+write: fs.copyFileSync hits EPERM
        // on virtual (v9fs/9p) filesystems, as does fs.cpSync's metadata ops.
        const outDir = path.join(__dirname, 'dist/assets/images');
        fs.mkdirSync(outDir, {recursive: true});
        for (const file of fs.readdirSync(cacheDir)) {
          const to = path.join(outDir, file);
          if (fs.existsSync(to)) continue;
          fs.writeFileSync(to, fs.readFileSync(path.join(cacheDir, file)));
        }
      }
    } catch (err) {
      console.warn(`[image-cache] sync failed: ${err.message}`);
      return;
    }
    // YouTube poster images: same per-file write pattern (v9fs EPERM).
    try {
      const ytDir = path.join(__dirname, '.cache', 'yt');
      if (fs.existsSync(ytDir)) {
        const ytOut = path.join(__dirname, 'dist/assets/images/yt');
        fs.mkdirSync(ytOut, {recursive: true});
        for (const file of fs.readdirSync(ytDir)) {
          const to = path.join(ytOut, file);
          if (fs.existsSync(to)) continue;
          fs.writeFileSync(to, fs.readFileSync(path.join(ytDir, file)));
        }
      }
    } catch (err) {
      console.warn(`[yt-thumbnails] sync failed: ${err.message}`);
    }
    // Link preview card images (see scripts/fetch-previews.cjs): same
    // per-file write pattern (v9fs EPERM).
    try {
      const prevDir = path.join(__dirname, '.cache', 'previews');
      if (fs.existsSync(prevDir)) {
        const prevOut = path.join(__dirname, 'dist/assets/images/previews');
        fs.mkdirSync(prevOut, {recursive: true});
        for (const file of fs.readdirSync(prevDir)) {
          const to = path.join(prevOut, file);
          if (fs.existsSync(to)) continue;
          fs.writeFileSync(to, fs.readFileSync(path.join(prevDir, file)));
        }
      }
    } catch (err) {
      console.warn(`[previews] sync failed: ${err.message}`);
    }
    try {
      if (!fs.existsSync(cacheDir)) return;

      const referenced = new Set();
      const distDir = path.join(__dirname, 'dist');
      const collectRefs = dir => {
        for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            collectRefs(full);
          } else if (entry.name.endsWith('.html')) {
            const html = fs.readFileSync(full, 'utf8');
            // Any extension: references include <source type="undefined">
            // tiff/gif variants (eleventy-img's 'auto' format) that a
            // narrower pattern would miss and wrongly prune.
            for (const match of html.matchAll(/assets\/images\/[^\s"'<>]+/g)) {
              referenced.add(match[0].replace(/^.*assets\/images\//, ''));
            }
          }
        }
      };
      if (fs.existsSync(distDir)) collectRefs(distDir);

      for (const file of fs.readdirSync(cacheDir)) {
        if (!referenced.has(file)) {
          fs.rmSync(path.join(cacheDir, file), {force: true});
        }
      }
      // Stale dist copies: when a variant is renamed (source image
      // edited, or encoding options changed) its old name is pruned
      // from the cache above but the dist copy would linger in the
      // build output. Same GC semantics as the yt/previews blocks
      // below, applied to the dist side instead. Passthrough
      // originals from src/assets/images are never generated variants,
      // so they survive even when unreferenced.
      const imagesDist = path.join(distDir, 'assets/images');
      if (fs.existsSync(imagesDist)) {
        for (const file of fs.readdirSync(imagesDist)) {
          const full = path.join(imagesDist, file);
          if (!fs.statSync(full).isFile()) continue; // yt/, previews/
          if (referenced.has(file)) continue;
          if (fs.existsSync(path.join(__dirname, 'src/assets/images', file))) {
            continue;
          }
          fs.rmSync(full, {force: true});
        }
      }
      // Same GC semantics for the YouTube poster cache: collected
      // references include "yt/<file>" entries. Stale dist copies are
      // removed too, so an old-format file (e.g. .jpg after the .webp
      // switch) cannot linger in the build output.
      const ytCache = path.join(__dirname, '.cache', 'yt');
      const ytDist = path.join(distDir, 'assets/images/yt');
      if (fs.existsSync(ytCache)) {
        for (const file of fs.readdirSync(ytCache)) {
          if (referenced.has(`yt/${file}`)) continue;
          fs.rmSync(path.join(ytCache, file), {force: true});
          if (fs.existsSync(ytDist)) {
            fs.rmSync(path.join(ytDist, file), {force: true});
          }
        }
      }
      // Link preview images: keep files referenced by a built page OR by
      // the cached JSON. The JSON's source URL is the only regeneration
      // path for a file, so a page-unreferenced file must survive cold
      // builds that re-localize from it.
      const prevCache = path.join(__dirname, '.cache', 'previews');
      const prevDist = path.join(distDir, 'assets/images/previews');
      if (fs.existsSync(prevCache)) {
        const jsonRefs = new Set();
        const previewJson = path.join(__dirname, '.cache', 'link-previews.json');
        try {
          const data = JSON.parse(fs.readFileSync(previewJson, 'utf8'));
          for (const entry of Object.values(data)) {
            for (const field of ['image', 'logo']) {
              const val = entry && entry[field];
              if (typeof val === 'string' && val.startsWith('/assets/images/previews/')) {
                jsonRefs.add(path.basename(val));
              }
            }
          }
        } catch {
          // No readable JSON: fall back to page references only.
        }
        for (const file of fs.readdirSync(prevCache)) {
          if (referenced.has(`previews/${file}`) || jsonRefs.has(file)) continue;
          fs.rmSync(path.join(prevCache, file), {force: true});
          if (fs.existsSync(prevDist)) {
            fs.rmSync(path.join(prevDist, file), {force: true});
          }
        }
      }
    } catch (err) {
      // GC is best-effort; a failure here must never break a build.
      console.warn(`[image-cache] GC skipped: ${err.message}`);
    }
  });
  // Per-page purge of the inlined global stylesheet: each page keeps only
  // the rules whose classes can occur on it (static markup plus markup its
  // own scripts create at runtime), recursing into @media blocks. Runs
  // first of the post-HTML hooks so the CV measurement below hashes the
  // final page bytes; its class extraction scans class= attributes and
  // script content only, so it is independent of the katex injection
  // that follows. Must finish before the compression pass so the
  // .br/.gz variants carry the purged bytes.
  const runPurgeCss = require('./scripts/purge-css.cjs');
  config.on('afterBuild', () => runPurgeCss());
  // Measure exact content-visibility block sizes for math pages before
  // katex-inline embeds them (zero-CLS contain-intrinsic-size values).
  // Runs on the built pages after the purge and before the injection:
  // the stored hash is over exactly those bytes, which is the canonical
  // form the standalone CLI (scripts/measure-cv-sizes.cjs) reduces a
  // built dist page to — so a manual run against a production dist is a
  // no-op when nothing changed. Re-measures only pages whose content
  // hash changed, and garbage-collects deleted pages in
  // .cache/cv-sizes.json. The afterBuild hooks run sequentially in
  // registration order (setEventEmitterMode above), so the katex-inline
  // hook below reads the fresh table. Degrades to the constant
  // estimates when Chrome or ws is unavailable. Production only: dev
  // (--serve) rebuilds stay fast.
  if (!process.argv.includes('--serve')) {
    const runMeasureCv = require('./scripts/measure-cv-sizes.cjs');
    config.on('afterBuild', () => runMeasureCv.run());
  }
  // Inline the per-page KaTeX CSS subset into math pages and prune the
  // unused fonts from the passthrough copy. Idempotent: pages already
  // carrying the injection (id="katex-inline" / id="cv-sizes") are
  // skipped, so running it over an already-built dist cannot corrupt
  // them. Must run before the compression pass below so the .br/.gz
  // variants include it.
  const runKatexInline = require('./scripts/katex-inline.cjs');
  config.on('afterBuild', () => runKatexInline());
  // Pre-compress text assets (brotli + gzip) after each production build,
  // so the site is fast on any static host — it does not depend on the
  // platform's own compression. Runs after the build completes, when
  // every file (templates, passthrough copies, generated images) is in
  // place; unlike a transform-based compressor this cannot race
  // Eleventy's parallel passthrough copies. Skipped for --serve so dev
  // rebuilds stay fast.
  if (!process.argv.includes('--serve')) {
    const COMPRESSED_EXTENSIONS = new Set([
      'html',
      'xml',
      'json',
      'css',
      'js',
      'mjs',
      'txt',
      'svg',
      'webmanifest',
      'md',
      'csv',
      'yml',
      'yaml'
    ]);
    const distDir = path.join(__dirname, 'dist');
    config.on('afterBuild', () => {
      if (!fs.existsSync(distDir)) return;
      const compressed = new Set();
      const walk = dir => {
        for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(full);
            continue;
          }
          const isVariant = /\.(br|gz)$/.test(entry.name);
          const base = isVariant ? entry.name.replace(/\.(br|gz)$/, '') : entry.name;
          if (isVariant) {
            // GC stale variants whose original was not compressed this
            // build (file deleted or changed kind).
            if (!compressed.has(path.relative(distDir, base)))
              fs.rmSync(full, {force: true});
            continue;
          }
          const ext = path
            .extname(base)
            .slice(1)
            .toLowerCase();
          if (!COMPRESSED_EXTENSIONS.has(ext)) continue;
          const data = fs.readFileSync(full);
          fs.writeFileSync(
            full + '.br',
            zlib.brotliCompressSync(data, {
              params: {
                [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY
              }
            })
          );
          fs.writeFileSync(
            full + '.gz',
            zlib.gzipSync(data, {level: zlib.constants.Z_MAX_LEVEL})
          );
          compressed.add(path.relative(distDir, base));
        }
      };
      walk(distDir);
    });
  } else {
    // Dev: compression is skipped, so remove any pre-compressed variants
    // left over from a previous production build (keeps dist clean and
    // prevents serving stale compressed bytes from a plain static server).
    const distDir = path.join(__dirname, 'dist');
    config.on('afterBuild', () => {
      if (!fs.existsSync(distDir)) return;
      const walk = dir => {
        for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(full);
          } else if (/\.(br|gz)$/.test(entry.name)) {
            fs.rmSync(full, {force: true});
          }
        }
      };
      walk(distDir);
    });
  }

  const now = new Date();

  // Custom collections
  const livePosts = post => post.date <= now && !post.data.draft;
  // All posts. Primarily used in archive page and XML feed.
  config.addCollection('posts', collection => {
    return [
      ...collection.getFilteredByGlob('./src/posts/*.md').filter(livePosts)
    ].reverse();
  });
  // Used for home page.
  config.addCollection('postFeed', collection => {
    return [...collection.getFilteredByGlob('./src/posts/*.md').filter(livePosts)]
      .reverse()
      .slice(0, site.maxPostsPerPage);
  });
  // Used for the all tags page.
  config.addCollection('tagList', collections => {
    const uniqueTags = collections
      .getFilteredByGlob('./src/posts/*.md')
      .filter(livePosts)
      .reduce((tags, item) => tags.concat(item.data.tags), [])
      .filter(tag => !!tag)
      .filter(tag => !!tag && !['page', 'post'].includes(tag))
      .sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));
    return Array.from(new Set(uniqueTags));
  });
  config.addPlugin(embedYouTube, {
    // CSS is inlined by the plugin (no render-blocking request); the JS is
    // self-hosted under /js (immutable) instead of the jsDelivr CDN.
    lite: {
      css: {inline: true},
      js: {path: '/js/components/lite-yt-embed.min.js'}
    }
  });
  // Non-serve builds must produce exactly the current source tree:
  // Eleventy never removes output for sources that were deleted (even
  // its --serve unlink handler only drops the file from the search
  // index), so a stale dist would keep shipping ghost pages — and the
  // CV measurement table would keep measuring them. Wipe dist, then re-run
  // the CSS build so the .cache record is fresh for the build that follows.
  // Dev (--serve) keeps the incremental dist;
  // scripts/watch-deletions.cjs prunes stale outputs there.
  if (!process.argv.includes('--serve')) {
    const distDir = path.join(__dirname, 'dist');
    config.on('beforeBuild', () => {
      fs.rmSync(distDir, {recursive: true, force: true});
      require('./scripts/build-css.cjs').ensureBuilt();
    });
  }
  // Cache the embed poster images at build time (offline-safe: only
  // fetches ids not already in .cache/yt).
  config.on('beforeBuild', () => require('./scripts/fetch-yt-thumbnails.cjs')());
  // Link previews (see scripts/fetch-previews.cjs): the committed JSON
  // already carries entries for referenced URLs; this only fetches URLs
  // added since the last manual refresh and refills .cache/previews files
  // missing on a cold checkout, so a fresh clone builds a complete site.
  // A warm cache makes this a no-op (no network, no JSON rewrite). Never
  // fails the build: a dead network leaves the filter's committed-entry
  // or plain-link fallback in place.
  config.on('beforeBuild', () =>
    require('./scripts/fetch-previews.cjs')({refresh: false}).catch(err =>
      console.warn(`[previews] skipped: ${err.message}`)
    )
  );
  // Localize the embed poster images: the plugin emits a remote
  // i.ytimg.com URL; swap it for the build-time-cached copy under
  // /assets/images/yt so pages make no remote requests at all.
  // Must be a plugin, not a top-level addTransform: Eleventy 3 executes
  // plugins in a second stage, in registration order — so this plugin's
  // transform lands after embedYouTube's and sees its output. (Top-level
  // transforms and beforeBuild transforms both run before the plugin's
  // transform; the render pipeline snapshots the list before beforeBuild.)
  config.addPlugin(eleventyConfig => {
    // The embed plugin (css: { inline: true }) inlines lite-youtube-embed's
    // full unminified CSS at the first <lite-youtube> embed. Swap it for
    // the vendored min build (same rules, no comments) so embed pages don't
    // ship extra whitespace. Exact string match on the plugin's own output,
    // so a post's own <style> block is never touched.
    const unminCss = fs.readFileSync(
      path.join(
        __dirname,
        'node_modules',
        'lite-youtube-embed',
        'src',
        'lite-yt-embed.css'
      ),
      'utf8'
    );
    const minCss = fs.readFileSync(
      path.join(__dirname, 'src', 'js', 'components', 'lite-yt-embed.min.css'),
      'utf8'
    );
    eleventyConfig.addTransform('minifyYtEmbedCss', content =>
      content.replace(`<style>${unminCss}</style>`, `<style>${minCss}</style>`)
    );
    eleventyConfig.addTransform('localizeYtThumbnails', (content, outputPath) => {
      if (
        !outputPath ||
        !outputPath.endsWith('.html') ||
        !content.includes('i.ytimg.com')
      ) {
        return content;
      }
      const cacheDir = path.join(__dirname, '.cache', 'yt');
      return content.replace(
        /https:\/\/i\.ytimg\.com\/(?:vi_webp|vi)\/([A-Za-z0-9-_]{11})\/[A-Za-z0-9_.]+/g,
        (url, id) =>
          fs.existsSync(path.join(cacheDir, `${id}.webp`))
            ? `/assets/images/yt/${id}.webp`
            : url
      );
    });
  });
  config.addPlugin(rssPlugin);
  config.addPlugin(syntaxHighlight);
  // Cache directories (.cache/images, .cache/yt, .cache/previews) are
  // synced to dist by the afterBuild hook above — Eleventy's passthrough
  // copy hits EPERM on virtual filesystems (see that hook's comments).
  // 404
  config.setBrowserSyncConfig({
    callbacks: {
      ready: function(err, browserSync) {
        const content_404 = fs.readFileSync('dist/404.html');

        browserSync.addMiddleware('*', (req, res, next) => {
          // Serve the 404 page (with a 404 status) for missing files only;
          // everything else falls through to the static handler.
          const urlPath = decodeURIComponent(req.url.split('?')[0]);
          const file = path.join(__dirname, 'dist', urlPath);
          // Existing files and directories (index.html resolution) go to
          // the static handler; only genuinely missing paths get the 404
          // page.
          if (fs.existsSync(file)) {
            return next();
          }
          res.statusCode = 404;
          res.write(content_404);
          res.end();
        });
      }
    }
  });
  return {
    dir: {
      input: 'src',
      output: 'dist'
    },
    passthroughFileCopy: true
  };
};
