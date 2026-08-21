/*
 * Shared Markdown engine
 *
 * Single markdown-it instance for the whole site: the Eleventy markdown
 * engine (post bodies) and every filter that renders markdown inline.
 * Configure rules here — this is the one place to modify Markdown
 * behavior (options + the KaTeX math rules below).
 */
const markdownIt = require('markdown-it');
const katex = require('katex');

/* ------------------------- KaTeX math rules ------------------------- */
/*
 * Inline math:  $e = mc^2$
 * Block math:   $$ \int_a^b f(x)\,dx $$   (single or multi-line)
 *
 * Conventions: no space directly inside the delimiters, and the opening $
 * may not follow a word character (keeps prices like 5$ out of math mode).
 * throwOnError: false renders invalid math as readable red text instead of
 * breaking the page build.
 */
function renderInline(tex) {
  return katex.renderToString(tex, { displayMode: false, throwOnError: false });
}

function renderBlock(tex) {
  return katex.renderToString(tex, { displayMode: true, throwOnError: false });
}

function katexInlineRule(state, silent) {
  const src = state.src;
  const start = state.pos;
  if (src[start] !== '$') return false;
  if (start > 0 && /[\w$]/.test(src[start - 1])) return false;

  const end = src.indexOf('$', start + 1);
  if (end === -1 || end === start + 1) return false;

  const tex = src.slice(start + 1, end);
  if (tex.includes('\n') || !tex.trim() || /^\s|\s$/.test(tex)) return false;

  if (!silent) {
    const token = state.push('html_inline', '', 0);
    token.content = renderInline(tex);
  }
  state.pos = end + 1;
  return true;
}

function katexBlockRule(state, startLine, endLine, silent) {
  const first = state.src
    .slice(state.bMarks[startLine] + state.tShift[startLine], state.eMarks[startLine]);
  const open = first.match(/^\s*\$\$([\s\S]*)$/);
  if (!open) return false;

  let tex;
  let nextLine = startLine + 1;
  const rest = open[1];
  const close = rest.match(/\$\$/);

  if (close) {
    // Single line: $$ ... $$
    if (rest.slice(close.index + 2).trim()) return false;
    tex = rest.slice(0, close.index).trim();
  } else {
    // Multi-line: collect until a line ending in $$
    const lines = rest.trim() ? [rest] : [];
    let closed = false;
    for (let i = startLine + 1; i < endLine; i++) {
      const row = state.src
        .slice(state.bMarks[i] + state.tShift[i], state.eMarks[i])
        .replace(/\s+$/, '');
      const m = row.match(/^(.*)\$\$\s*$/);
      if (m) {
        if (m[1].trim()) lines.push(m[1]);
        closed = true;
        nextLine = i + 1;
        break;
      }
      lines.push(row);
    }
    if (!closed) return false;
    tex = lines.join('\n').trim();
  }

  if (!tex) return false;
  if (silent) return true;

  const token = state.push('html_block', '', 0);
  token.content = `\n${renderBlock(tex)}\n`;
  token.block = true;
  state.line = nextLine;
  return true;
}

function katexPlugin(md) {
  md.block.ruler.before('fence', 'katex_block', katexBlockRule);
  md.inline.ruler.before('escape', 'katex_inline', katexInlineRule);
}

/* ----------------------------- engine ------------------------------ */

const markdown = markdownIt({
  html: true,
  breaks: false,
  linkify: true,
}).use(katexPlugin);

module.exports = {
  markdown,
  render: (value) => markdown.render(value),
};
