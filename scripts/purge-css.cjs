/**
 * Per-page global stylesheet purge.
 *
 * base.njk inlines the entire built global stylesheet (scripts/build-css.cjs,
 * exposed as cssBuild.content) as <style id="global-css"> on every page.
 * This afterBuild hook rewrites that style in each page so it only carries
 * the rules that can actually match on that page:
 *
 *  - A class selector is kept when every class it requires is present on the
 *    page. "Present" = in any class="..." attribute of the HTML, or in the
 *    markup the page's own scripts create at runtime (theme-toggle renders
 *    its whole UI in JS; lite-youtube adds its play button in JS). Class
 *    names compare in their unescaped form, so .md\:ta-right matches
 *    class="md:ta-right".
 *  - @media / @supports blocks are recursed into, so dark-mode and
 *    breakpoint variants survive per page.
 *  - Selectors without classes (elements, attributes, :root, *, …) are
 *    always kept, and classes inside (…){:not, :is, …} never count as
 *    required — a rule matching "elements that are NOT .x" must survive
 *    even on pages where .x never appears.
 *  - @font-face / @keyframes blocks are kept verbatim.
 *
 * Ordering: runs after katex-inline (its data-cv attributes are added to
 * the HTML at that point and must survive the purge) and before the
 * compression pass (the purged bytes are what get .br/.gz'd).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const STYLE_ID = 'global-css';

// ---- class extraction ----------------------------------------------------

const CLASS_ATTR = /class\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const CLASSLIST = /classList\.(?:add|toggle|replace|remove)\(\s*(?:"([^"]*)"|'([^']*)')/g;
const CLASSNAME = /className\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

function addTokens(out, ...groups) {
  for (const g of groups) {
    if (!g) continue;
    for (const t of g.split(/\s+/)) if (t) out.add(t);
  }
}

function extractFromText(text, out) {
  for (const m of text.matchAll(CLASS_ATTR)) addTokens(out, m[1], m[2]);
  for (const m of text.matchAll(CLASSLIST)) addTokens(out, m[1], m[2]);
  for (const m of text.matchAll(CLASSNAME)) addTokens(out, m[1], m[2]);
}

/**
 * Every class name that can exist in the DOM of this page: static markup
 * plus whatever the page's scripts add at runtime (external scripts are
 * read from dist; inline scripts from the page itself).
 */
function pageClasses(html, distDir) {
  const classes = new Set();
  extractFromText(html, classes);
  for (const m of html.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/g)) {
    const src = m[1].split(/[?#]/)[0];
    if (!src.startsWith('/')) continue;
    try {
      extractFromText(fs.readFileSync(path.join(distDir, '.' + src), 'utf8'), classes);
    } catch {
      // script not in dist (e.g. remote) — nothing local to extract
    }
  }
  for (const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {
    extractFromText(m[1], classes);
  }
  return classes;
}

// ---- CSS parsing ----------------------------------------------------------

/** Top-level {…} blocks: [{ prelude, body }]. Brace-depth aware. */
function parseBlocks(css) {
  const blocks = [];
  let i = 0;
  const n = css.length;
  while (i < n) {
    const open = css.indexOf('{', i);
    if (open === -1) break;
    let depth = 1;
    let j = open + 1;
    while (j < n && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }
    blocks.push({ prelude: css.slice(i, open), body: css.slice(open + 1, j - 1) });
    i = j;
  }
  return blocks;
}

/**
 * Class names a single selector requires: every .name at parenthesis/bracket
 * depth 0, with backslash escapes resolved (md\:align-start -> md:align-start).
 * Names inside (…)/[…] — :not(), :is(), [attr="…"] — are deliberately not
 * required.
 */
function requiredClasses(selector) {
  const required = new Set();
  let depth = 0;
  let i = 0;
  const n = selector.length;
  while (i < n) {
    const c = selector[i];
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === '.' && depth === 0) {
      let name = '';
      let k = i + 1;
      while (k < n) {
        const ch = selector[k];
        if (ch === '\\') {
          if (k + 1 >= n) break;
          const next = selector[k + 1];
          if (/[0-9a-fA-F]/.test(next)) {
            let hex = '';
            while (k + 1 < n && /[0-9a-fA-F]/.test(selector[k + 1])) {
              hex += selector[k + 1];
              k++;
            }
            name += String.fromCodePoint(parseInt(hex, 16));
            if (k + 1 < n && selector[k + 1] === ' ') k++;
          } else {
            name += next;
            k++;
          }
          continue;
        }
        if (/[A-Za-z0-9_-]/.test(ch)) {
          name += ch;
          k++;
        } else break;
      }
      if (name) required.add(name);
      i = k;
      continue;
    }
    i++;
  }
  return required;
}

/** Keep the comma-separated selector list whose parts all match the page. */
function keepSelectors(prelude, classes) {
  const parts = [];
  let depth = 0;
  let esc = false;
  let cur = '';
  for (const c of prelude) {
    if (esc) {
      cur += c;
      esc = false;
      continue;
    }
    if (c === '\\') {
      cur += c;
      esc = true;
      continue;
    }
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    if (c === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else cur += c;
  }
  parts.push(cur);
  const kept = [];
  for (const part of parts) {
    const sel = part.trim();
    if (!sel) continue;
    let ok = true;
    for (const cls of requiredClasses(sel)) {
      if (!classes.has(cls)) {
        ok = false;
        break;
      }
    }
    if (ok) kept.push(sel);
  }
  return kept.join(',');
}

function purgeRule(block, classes) {
  const prelude = block.prelude.trim();
  if (!prelude) return '';
  if (prelude.startsWith('@media') || prelude.startsWith('@supports')) {
    const inner = purgeBody(block.body, classes);
    return inner ? `${prelude}{${inner}}` : '';
  }
  if (prelude.startsWith('@')) {
    // @font-face, @keyframes, @page, …: keep verbatim
    return `{${block.body}}`;
  }
  const kept = keepSelectors(prelude, classes);
  return kept ? `${kept}{${block.body}}` : '';
}

function purgeBody(css, classes) {
  const out = [];
  for (const block of parseBlocks(css)) {
    const purged = purgeRule(block, classes);
    if (purged) out.push(purged);
  }
  return out.join('');
}

// ---- main -----------------------------------------------------------------

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

module.exports = function purgeCssPages() {
  const distDir = path.resolve(root, process.env.PURGE_DIST || 'dist');
  const styleRe = new RegExp(`(<style id="${STYLE_ID}">)([\\s\\S]*?)(</style>)`);

  let pages = 0;
  let before = 0;
  let after = 0;
  for (const file of walkHtml(distDir)) {
    const html = fs.readFileSync(file, 'utf8');
    const m = html.match(styleRe);
    if (!m) continue;
    const purged = purgeBody(m[2], pageClasses(html, distDir));
    if (!purged || purged.length >= m[2].length) continue;
    fs.writeFileSync(file, html.replace(styleRe, () => `${m[1]}${purged}${m[3]}`));
    pages++;
    before += m[2].length;
    after += purged.length;
  }
  const pct = before ? (100 * (1 - after / before)).toFixed(1) : '0.0';
  console.log(
    `[purge-css] ${pages} page(s): ${(before / 1024).toFixed(1)}kB -> ${(after / 1024).toFixed(1)}kB inlined global CSS (${pct}% removed)`
  );
};

if (require.main === module) {
  module.exports();
}
