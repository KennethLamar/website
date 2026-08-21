/*
 * KaTeX CSS inliner
 *
 * The base layout used to emit /assets/katex/katex.min.css on every page,
 * but only pages that render math actually need it — and the stock CSS
 * declares font-display:block, which delays first paint on math pages.
 *
 * This script runs as an afterBuild hook (after the HTML is final, before
 * the compression pass). The content-visibility table it embeds is
 * auto-measured at every production build by the measure hook that runs
 * just before this one:
 *
 * 1. For each built HTML page containing KaTeX markup, subset
 *    katex.min.css down to the rules whose class selectors actually
 *    appear on the page, plus the @font-face rules for the font
 *    families those rules use.
 * 2. Normalize the subset: font-display:block -> swap, keep only the
 *    woff2 src entries, make font URLs root-absolute.
 * 3. Inline the result as <style id="katex-inline"> in the page's
 *    <head> (rendered after the global stylesheet), so math pages carry
 *    no extra render-blocking request and no blocking font. Idempotent:
 *    pages already carrying the injection (id="katex-inline" or
 *    id="cv-sizes") are skipped, so running this over an already-built
 *    dist cannot corrupt them.
 * 4. Prune dist/assets/katex down to the woff2 files actually
 *    referenced — the passthrough copy brings the whole 3.9MB package.
 * 5. Give every block-level element in the content region (see cvScope)
 *    and every katex-display span content-visibility:auto. KaTeX's many
 *    @font-face rules re-layout the whole math DOM as each font
 *    arrives; skipping layout for below-the-fold sections removes the
 *    cascade from first paint. contain-intrinsic-size reserves each
 *    block's space, so the layout stays stable (no CLS); the `auto`
 *    keyword makes the browser remember actual sizes after first
 *    render. Above-the-fold blocks render normally — content-visibility
 *    only skips offscreen work.
 *
 *    Blocks are marked with a data-cv="N" attribute, NOT a class: the
 *    global stylesheet styles plain lists via :not([class]) selectors
 *    (margin, spacing, list-style), so any added class would re-style
 *    the element and make the rendered CV height differ from the raw
 *    measured height — CLS plus a visible layout regression.
 *
 * katex.min.css is flat (no @media, no nesting), so brace-splitting is
 * safe. Classes inside :not(...) are never required: an element may
 * match a rule precisely because it lacks that class.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const KATEX_CSS = path.join(root, 'node_modules', 'katex', 'dist', 'katex.min.css');
const CV_SIZES = path.join(root, '.cache', 'cv-sizes.json');
const distDir = path.join(root, 'dist');
const katexDir = path.join(distDir, 'assets', 'katex');

let cssSource = null;

/** Split flat CSS into [{prelude, body}] rules. */
function parseRules(css) {
  const rules = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open === -1) break;
    const prelude = css.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth += 1;
      else if (css[j] === '}') depth -= 1;
      j += 1;
    }
    if (prelude) rules.push({ prelude, body: css.slice(open + 1, j - 1).trim() });
    i = j;
  }
  return rules;
}

/** Class names a selector requires: .name tokens at paren depth 0. */
function requiredClasses(prelude) {
  const required = new Set();
  for (const m of prelude.matchAll(/\.([A-Za-z_][\w-]*)/g)) {
    const before = prelude.slice(0, m.index);
    const depth = (before.match(/\(/g) || []).length - (before.match(/\)/g) || []).length;
    if (depth === 0) required.add(m[1]);
  }
  return required;
}

function selectorMatches(selector, pageClasses) {
  for (const cls of requiredClasses(selector)) {
    if (!pageClasses.has(cls)) return false;
  }
  return true;
}

/**
 * Subset the KaTeX CSS for one page.
 * @param {Set<string>} pageClasses every class name present in the page.
 */
function subsetKatexCss(css, pageClasses) {
  const rules = parseRules(css);
  const kept = [];
  const families = new Set();

  // Pass 1: ordinary rules — keep selectors whose required classes exist.
  for (const rule of rules) {
    if (rule.prelude.startsWith('@')) continue;
    const selectors = rule.prelude
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const keptSelectors = selectors.filter((s) => selectorMatches(s, pageClasses));
    if (!keptSelectors.length) continue;
    for (const m of rule.body.matchAll(/font-family:\s*([\w-]+)/g)) {
      families.add(m[1]);
    }
    kept.push(`${keptSelectors.join(',')}{${rule.body}}`);
  }

  // Pass 2: @font-face for the families the kept rules use.
  for (const rule of rules) {
    if (!rule.prelude.startsWith('@font-face')) continue;
    const fm = rule.body.match(/font-family:\s*["']?([\w-]+)/);
    if (!fm || !families.has(fm[1])) continue;
    let body = rule.body;
    body = body.replace(/font-display:\s*[\w-]+/, 'font-display:swap');
    body = body.replace(/src:([^;]+)/, (_m, list) => {
      const entries = list
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.includes('.woff2)'));
      return `src:${entries.join(',')}`;
    });
    body = body.replace(/url\(\s*fonts\//g, 'url(/assets/katex/fonts/');
    kept.push(`@font-face{${body.trim()}}`);
  }

  return kept.join('');
}

function pageClassesOf(html) {
  const classes = new Set();
  for (const m of html.matchAll(/class="([^"]*)"/g)) {
    for (const cls of m[1].split(/\s+/)) {
      if (cls) classes.add(cls);
    }
  }
  return classes;
}

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtml(full, out);
    } else if (entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

// The per-page content-visibility table (.cache/cv-sizes.json) is read
// fresh inside runKatexInline so it reflects the re-measurement the
// measure hook performs just before this one.

/**
 * Content region content-visibility targets: the page's <main> element,
 * narrowed to its <article> when it has one (post and page content).
 * The footer partial's <article> sits outside <main>, so it is never
 * wrapped; math anywhere else still renders with the inlined CSS but
 * gets no CV treatment.
 * Returns the region as [start, end) string offsets, or null when the
 * page has no <main>. cvBlockCount and the measurement worker's browser
 * scope (cv-measure-worker.cjs) MUST stay in sync with this.
 */
function cvScope(html) {
  const main = html.indexOf('<main');
  if (main < 0) return null;
  const mainEnd = html.indexOf('</main>', main);
  if (mainEnd < 0) return null;
  const art = html.indexOf('<article', main);
  if (art !== -1 && art < mainEnd) {
    const artEnd = html.indexOf('</article>', art);
    if (artEnd !== -1 && artEnd < mainEnd) return [art, artEnd];
  }
  return [main, mainEnd];
}

/**
 * Add content-visibility:auto to every block-level element in the
 * content region (see cvScope) and to every katex-display span. Only
 * offscreen blocks are
 * affected (in-viewport elements render normally), so first paint loses
 * the below-the-fold layout work without any visual change.
 *
 * contain-intrinsic-size reserves each block's space so the page never
 * reflows when a block enters the rendering range (zero CLS). The values
 * come from .cache/cv-sizes.json (exact per-element, per width,
 * auto-measured at build time); without a fresh table for the page,
 * constants approximate.
 * Returns { html, cvStyle } — cvStyle is a <style> for the <head>.
 */
function addContentVisibility(html, pageId, cvSizes) {
  const scope = cvScope(html);
  if (!scope) return { html, cvStyle: '' };
  const [start, end] = scope;
  let n = 0;
  const isMath = [];
  const addAttr = (open) => {
    n += 1;
    return open.replace(/>$/, ` data-cv="${n}">`);
  };

  const head = html.slice(0, start);
  const tail = html.slice(end);
  let body = html.slice(start, end);
  body = body.replace(CV_BLOCK_RE, (open) => {
    isMath.push(open.startsWith('<span'));
    return addAttr(open);
  });

  const entry =
    cvSizes && typeof cvSizes === 'object' && !Array.isArray(cvSizes)
      ? cvSizes[pageId]
      : null;
  const hasTable =
    entry && Array.isArray(entry.mobile) && Array.isArray(entry.desktop) &&
    entry.mobile.length === n && entry.desktop.length === n;
  const mobile = hasTable ? entry.mobile : isMath.map((m) => (m ? 200 : 120));
  const desktop = hasTable ? entry.desktop : isMath.map((m) => (m ? 200 : 120));

  let css = '';
  for (let i = 0; i < n; i += 1) css += `[data-cv="${i + 1}"]{content-visibility:auto;contain-intrinsic-size:auto ${mobile[i]}px}`;
  css += '@media(min-width:768px){';
  for (let i = 0; i < n; i += 1) css += `[data-cv="${i + 1}"]{contain-intrinsic-size:auto ${desktop[i]}px}`;
  css += '}';

  return { html: head + body + tail, cvStyle: `<style id="cv-sizes">${css}</style>` };
}


module.exports = function runKatexInline() {
  if (!fs.existsSync(distDir)) return;
  const css = fs.readFileSync(KATEX_CSS, 'utf8');
  // Read the table fresh: the measure hook (registered just before us in
  // .eleventy.js) may have re-measured pages for this build.
  let cvSizes = null;
  try {
    cvSizes = JSON.parse(fs.readFileSync(CV_SIZES, 'utf8'));
  } catch {
    cvSizes = null;
  }

  const referencedFonts = new Set();
  let inlined = 0;
  let skipped = 0;
  const collectFonts = (text) => {
    for (const m of text.matchAll(/url\(\/assets\/katex\/fonts\/([\w.-]+\.woff2)\)/g)) {
      referencedFonts.add(m[1]);
    }
  };

  for (const file of walkHtml(distDir)) {
    const html = fs.readFileSync(file, 'utf8');
    if (!isMathPage(html)) continue;

    if (INJECTED_RE.test(html)) {
      // Already processed: this is built output, not a fresh Eleventy
      // write (standalone run over an existing dist). Re-running the
      // injection would duplicate the styles and renumber the data-cv
      // attributes — the katex-display span only matches while
      // un-attributed, so a second pass skips it and the new cv-sizes
      // table ends up mapping block numbers to the wrong elements.
      // Keep the existing injection; just account for its fonts below.
      collectFonts(html);
      skipped += 1;
      continue;
    }

    const subset = subsetKatexCss(css, pageClassesOf(html));
    const cv = addContentVisibility(html, pageIdOf(file), cvSizes);
    const styleTag = `<style id="katex-inline">${subset}</style>` + cv.cvStyle;
    const out = injectAfterGlobalCss(cv.html, styleTag);
    fs.writeFileSync(file, out);
    collectFonts(out);
    inlined += 1;
    console.log(`[katex] inlined subset for ${path.relative(distDir, file)}`);
  }

  // Prune the passthrough copy: keep only referenced woff2 files.
  const fontsDir = path.join(katexDir, 'fonts');
  if (fs.existsSync(fontsDir)) {
    for (const file of fs.readdirSync(fontsDir)) {
      if (!referencedFonts.has(file)) {
        fs.rmSync(path.join(fontsDir, file), { force: true });
      }
    }
  }
  for (const file of fs.readdirSync(katexDir)) {
    if (file === 'fonts') continue;
    fs.rmSync(path.join(katexDir, file), { recursive: true, force: true });
  }

  console.log(
    `[katex] ${inlined} page(s) inlined` +
      (skipped ? `, ${skipped} already-injected page(s) skipped` : '') +
      `; kept ${referencedFonts.size} font(s): ${[...referencedFonts].join(', ') || '(none)'}`
  );
};
/**
 * Insert a <style> tag right after the inlined global stylesheet; fall
 * back to </head>. (Function replacer: the CSS contains '$' sequences that
 * a string replacement would expand.)
 */
function injectAfterGlobalCss(html, styleTag) {
  const styleMatch = html.match(/<style id="global-css">[\s\S]*?<\/style>/);
  if (styleMatch) {
    return html.replace(styleMatch[0], () => styleMatch[0] + styleTag);
  }
  return html.replace('</head>', styleTag + '</head>');
}

/**
 * Stable id for a built page: dist-relative path with / -> __, .html and a
 * trailing __index stripped (posts/katex-tour/index.html -> posts__katex-tour).
 */
function pageIdOf(file) {
  let id = path.relative(distDir, file).split(path.sep).join('__').replace(/\.html$/, '');
  if (id.endsWith('__index')) id = id.slice(0, -'__index'.length);
  return id;
}

function isMathPage(html) {
  return html.includes('class="katex"') || html.includes('class="katex ');
}

// The blocks addContentVisibility wraps; the measurer counts the same set
// (its browser selector must mirror this regex).
const CV_BLOCK_RE = /<span class="katex-display">|<(?:p|h2|h3|ul|figure|pre)(?: [^>]*)?>/g;
// Injection marker: the id-tagged subset style (current builds) or the
// cv-sizes style (every build, including older ones whose subset style
// was bare). A fresh Eleventy page carries neither.
const INJECTED_RE = /<style id="(?:katex-inline|cv-sizes)"/;
/**
 * Number of content-visibility blocks in a built page — the content
 * region (cvScope) only, exactly the set addContentVisibility wraps.
 * The measurer must use this for its block count (a document-wide
 * count includes blocks in the header/footer that are never wrapped).
 */
function cvBlockCount(html) {
  const scope = cvScope(html);
  if (!scope) return 0;
  return (html.slice(scope[0], scope[1]).match(CV_BLOCK_RE) || []).length;
}

module.exports.injectAfterGlobalCss = injectAfterGlobalCss;
module.exports.pageIdOf = pageIdOf;
module.exports.cvScope = cvScope;
module.exports.isMathPage = isMathPage;
module.exports.subsetKatexCss = subsetKatexCss;
module.exports.pageClassesOf = pageClassesOf;
module.exports.KATEX_CSS = KATEX_CSS;
module.exports.CV_BLOCK_RE = CV_BLOCK_RE;
module.exports.cvBlockCount = cvBlockCount;

if (require.main === module) {
  module.exports();
}
