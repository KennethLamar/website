const htmlmin = require('html-minifier');
const CleanCSS = require('clean-css');

// Conservative CSS minification (whitespace and comments only; level 1,
// no rewrites or rule merging) for the inline <style> blocks that reach
// this step unminified: the coin-tracker and styleguide page styles and
// the vendored lite-yt-embed CSS. The katex inline blocks are already
// minified; the pass is idempotent over them. The global stylesheet is
// minified by the sass build (style: compressed) and must not be
// re-minified here — clean-css reorders selectors even at level 1.
const cleanCss = new CleanCSS({level: 1});
const GLOBAL_STYLE_ID = /id=["']global-css["']/;

function minifyInlineStyles(html) {
  return html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (match, attrs, css) => {
    if (css.trim() === '' || GLOBAL_STYLE_ID.test(attrs)) {
      return match;
    }
    const result = cleanCss.minify(css);
    if (result.errors.length > 0 || !result.styles) {
      return match;
    }
    return `<style${attrs}>${result.styles}</style>`;
  });
}

module.exports = function htmlMinTransform(value, outputPath) {
  if (outputPath.indexOf('.html') > -1) {
    let minified = htmlmin.minify(minifyInlineStyles(value), {
      useShortDoctype: true,
      removeComments: true,
      collapseWhitespace: true,
      // The global CSS is already minified by sass and inlined verbatim;
      // letting html-minifier re-minify it drops declarations (clean-css
      // selector rewrite).
      minifyCSS: false,
      // UglifyJS minifies inline <script> content only; external src=
      // scripts are untouched, and a script that fails to parse is left
      // as-is (html-minifier logs and falls back). Boolean true maps to
      // UglifyJS defaults (no compress, no mangle) — pass the options
      // explicitly for a full minification.
      minifyJS: { compress: true, mangle: true }
    });
    return minified;
  }
  return value;
};
