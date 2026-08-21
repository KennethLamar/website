/*
 * Absolute-URL filter
 *
 * {{ renderedHtml | absoluteize: site.url }}
 *
 * Rewrites root-relative src/href attributes (src="/x" or href="/x") to
 * absolute URLs against the given base. Used by the RSS feed: some feed
 * readers do not resolve relative image URLs against the feed's URL.
 * Protocol-relative (src="//cdn...") and already-absolute URLs are left
 * alone.
 *
 * Pattern: src="/ or href="/ NOT followed by another / (which would make
 * it protocol-relative). Built via RegExp ctor to keep the slashes
 * readable.
 */
const ROOT_RELATIVE = new RegExp('(src|href)="/(?!/)', 'g');

module.exports = function absoluteize(html, baseUrl) {
  if (!html || !baseUrl) return html;
  const base = String(baseUrl).replace(/\/+$/, '');
  return String(html).replace(ROOT_RELATIVE, (m, attr) => `${attr}="${base}/`);
};
