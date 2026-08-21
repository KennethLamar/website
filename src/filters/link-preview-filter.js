/*
 * Link preview filter
 *
 * {{ "https://example.com" | linkPreview: true }}
 *
 * Metadata is precomputed offline — `npm run fetch:previews` writes
 * .cache/link-previews.json (gitignored; the build's beforeBuild hook
 * refetches it on a fresh clone), which this filter reads. Warm builds
 * stay fast and never need network access. URLs without a cached entry
 * fall back to a plain (linkified) link.
 */
const fs = require('fs');
const path = require('path');
const { markdown } = require('../utils/markdown.js');

const DATA_FILE = path.join(__dirname, '..', '..', '.cache', 'link-previews.json');

let cached = {};
let cachedMtime = 0;

function loadPreviews() {
  try {
    const stat = fs.statSync(DATA_FILE);
    if (stat.mtimeMs !== cachedMtime) {
      cached = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      cachedMtime = stat.mtimeMs;
    }
    return cached;
  } catch {
    return {};
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

module.exports = function linkPreviewFilter(targetUrl, fullImage = false) {
  const meta = loadPreviews()[targetUrl];

  // No cached metadata: render as a plain link.
  if (!meta || (!meta.title && !meta.description)) {
    return markdown.render(targetUrl);
  }

  const title = meta.title || targetUrl;
  const logo = meta.logo || meta.logoFavicon || '';
  const image = fullImage ? (meta.image || '') : '';

  // One card: preview image on top, then icon + title + description
  // beneath it. The outer element must be a block-level tag: Markdown
  // treats a line starting with <div> as a raw HTML block, while an
  // <a> wrapper would be wrapped in <p> — and browsers close that <p>
  // at the first inner <div>, splitting the card apart.
  // width/height keep the layout stable while the image loads (CLS).
  const imgAttrs =
    meta.imageWidth && meta.imageHeight
      ? ` width="${meta.imageWidth}" height="${meta.imageHeight}"`
      : '';
  const favAttrs =
    meta.logoWidth && meta.logoHeight
      ? ` width="${meta.logoWidth}" height="${meta.logoHeight}"`
      : '';

  let html = `<div class="lp">
    <a class="lp-link" href="${escapeHtml(targetUrl)}">` +
    (image
      ? `<img class="lp-img" src="${escapeHtml(image)}" alt="${escapeHtml(title)}"${imgAttrs}>`
      : '') +
    '<div class="met">' +
    (logo
      ? `<img class="fav" src="${escapeHtml(logo)}" alt="${escapeHtml(meta.publisher || 'Site icon')}"${favAttrs}>`
      : '') +
    '<div class="txt">' +
    `<strong class="ttl">${escapeHtml(title)}</strong>` +
    (meta.description ? `<span class="dsc">${escapeHtml(meta.description)}</span>` : '') +
    '<div class="attr">' +
    (meta.author ? `<em class="by">${escapeHtml(meta.author)}</em>` : '') +
    (meta.publisher ? `<em class="pub">${escapeHtml(meta.publisher)}</em>` : '') +
    '</div></div></div></a></div>';

  return html.replace(/[\n\r]/g, ' ');
};
