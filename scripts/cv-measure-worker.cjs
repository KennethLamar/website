/*
 * Worker-thread half of scripts/measure-cv-sizes.cjs.
 *
 * The afterBuild hook (measure-cv-sizes.cjs run()) must finish before
 * katex-inline reads the cv table, but Eleventy runs its afterBuild
 * listeners in parallel — so this worker does the async Chrome work while
 * the main thread blocks on Atomics.wait.
 *
 * Serves dist/ on an ephemeral localhost port. Math pages are served with
 * the per-page KaTeX subset injected (exactly what katex-inline does) but
 * without the content-visibility styles, so offsetHeights are the true
 * post-build heights.
 *
 * Writes { ok, results } (or { ok: false, error }) to workerData.out, then
 * sets the shared flag the main thread waits on.
 */
'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { workerData } = require('worker_threads');
const katex = require('./katex-inline.cjs');

const { distDir, work, out, sab } = workerData;
const CHROME =
  process.env.CHROME_PATH ||
  '/workspace/chrome/chrome-linux64/chrome';
// Chrome needs the shared libs and font config from the workspace toolchain.
const LIBS =
  process.env.CV_LIBS ||
  '/workspace/chrome-deps/usr/lib/x86_64-linux-gnu';
const FONTS = process.env.CV_FONTS || '/workspace/fonts/fonts.conf';
const WIDTHS = [
  { name: 'mobile', width: 412 },
  { name: 'desktop', width: 1350 },
];
// Oversized viewport: every block starts inside the rendering range, so
// offsetHeight is the true height.
const MEASURE_EXPR = `(() => {
  const main = document.querySelector('main');
  const art = main ? main.querySelector('article') : null;
  const root = art || main;
  const els = root
    ? root.querySelectorAll('p, h2, h3, ul, figure, pre, span.katex-display')
    : [];
  return JSON.stringify({ n: els.length, h: Array.from(els, (el) => el.offsetHeight) });
})()`;

const view = new Int32Array(sab);
let done = false;
function finish(payload) {
  if (done) return;
  done = true;
  try {
    fs.writeFileSync(out, JSON.stringify(payload));
  } catch {
    // Parent treats a missing file as failure.
  }
  Atomics.store(view, 0, 1);
  // Wake the main thread's Atomics.wait immediately (it polls 1s anyway,
  // but this avoids the tail latency on every measurement).
  Atomics.notify(view, 0);
}

/** Ephemeral static server for dist/ (math pages get the KaTeX subset). */
function startServer(css) {
  const server = http.createServer((req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const file0 = path.normalize(path.join(distDir, urlPath));
    if (file0 !== distDir && !file0.startsWith(distDir + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    let file = file0;
    try {
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      const buf = fs.readFileSync(file);
      const type = file.endsWith('.css') ? 'text/css'
        : file.endsWith('.js') ? 'text/javascript'
        : file.endsWith('.woff2') ? 'font/woff2'
        : file.endsWith('.html') ? 'text/html'
        : 'application/octet-stream';
      if (file.endsWith('.html')) {
        // Serve math pages exactly as katex-inline will emit them, minus
        // the content-visibility styles: true post-build heights.
        const text = buf.toString('utf8');
        if (katex.isMathPage(text)) {
          const subset = katex.subsetKatexCss(css, katex.pageClassesOf(text));
          res.writeHead(200, { 'Content-Type': type });
          res.end(katex.injectAfterGlobalCss(text, `<style>${subset}</style>`));
          return;
        }
      }
      res.writeHead(200, { 'Content-Type': type });
      res.end(buf);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function launchChrome(profile) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const proc = spawn(CHROME, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
      '--mute-audio', '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
    ], {
      stdio: ['ignore', 'ignore', 'pipe'],
      env: {
        ...process.env,
        LD_LIBRARY_PATH: LIBS + (process.env.LD_LIBRARY_PATH ? `:${process.env.LD_LIBRARY_PATH}` : ''),
        FONTCONFIG_FILE: FONTS,
      },
    });
    const t = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill('SIGKILL');
        reject(new Error('chrome launch timeout'));
      }
    }, 20000);
    let buf = '';
    proc.stderr.on('data', (d) => {
      buf += String(d);
      const m = /listening on ws:\/\/127\.0\.0\.1:(\d+)/.exec(buf);
      if (m && !settled) {
        settled = true;
        clearTimeout(t);
        resolve({ port: Number(m[1]), kill: () => proc.kill('SIGKILL') });
      }
    });
    proc.on('exit', (code, sig) => {
      if (!settled) {
        settled = true;
        clearTimeout(t);
        reject(new Error(`chrome exited early: ${code} ${sig}`));
      }
    });
  });
}

function newPage(port, url) {
  // Chrome >= 111 requires PUT on /json/new.
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port, path: `/json/new?${encodeURIComponent(url)}`, method: 'PUT' },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body).id);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function waitEvent(ws, name, timeout) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      ws.off('message', onMsg);
      reject(new Error(`timeout waiting for ${name}`));
    }, timeout);
    const onMsg = (data) => {
      const msg = JSON.parse(String(data));
      if (msg.method === name) {
        clearTimeout(t);
        ws.off('message', onMsg);
        resolve();
      }
    };
    ws.on('message', onMsg);
  });
}

async function main() {
  const WebSocket = require('ws');
  const css = fs.readFileSync(katex.KATEX_CSS, 'utf8');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-measure-'));
  const results = {};
  let server, chrome, ws;
  try {
    server = await startServer(css);
    const base = `http://127.0.0.1:${server.address().port}`;
    chrome = await launchChrome(profile);
    ws = new WebSocket(
      `ws://127.0.0.1:${chrome.port}/devtools/page/${await newPage(chrome.port, 'about:blank')}`
    );
    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
    });
    let seq = 0;
    const pending = new Map();
    const send = (method, params) => new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
    ws.on('message', (data) => {
      const msg = JSON.parse(String(data));
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
      }
    });
    await send('Page.enable');
    await send('Runtime.enable');

    for (const item of work) {
      const rel = path.relative(distDir, item.file).split(path.sep).join('/');
      const url = `${base}/${rel}`;
      try {
        const per = {};
        for (const { name, width } of WIDTHS) {
          // Oversized viewport: every block inside the rendering range.
          await send('Emulation.setDeviceMetricsOverride', {
            width, height: 20000, deviceScaleFactor: 1, mobile: name === 'mobile',
          });
          await send('Page.navigate', { url });
          await waitEvent(ws, 'Page.loadEventFired', 20000);
          // Wait until the font faces have settled: in-flight loads complete AND
          // no new face starts loading within a 150ms window. KaTeX subsets load
          // per unicode-range block, and blocks can start loading after
          // fonts.ready resolves when a late layout requests them; a single
          // measurement during that gap records the fallback metrics and inflates
          // the height.
          await send('Runtime.evaluate', {
            expression:
              '(async () => {' +
              'const deadline = Date.now() + 15000;' +
              'const settled = () => [...document.fonts].every(' +
              'f => f.status === "loaded" || f.status === "unloaded" || f.status === "error");' +
              'await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(),' +
              'new Promise((r) => setTimeout(r, 10000))]);' +
              'let prev = false;' +
              'while (Date.now() < deadline) {' +
              'const s = settled();' +
              'if (s && prev) return;' +
              'prev = s;' +
              'await new Promise((r) => setTimeout(r, 150));' +
              '}' +
              '})()',
            awaitPromise: true,
            returnByValue: true,
          });
          // Measure until two consecutive readings agree: catches any in-flight
          // reflow (font swap) the font wait cannot rule out under CPU load.
          let parsed = null;
          let prevHeights = null;
          let heights = null;
          for (let i = 0; i < 10; i++) {
            const { result } = await send('Runtime.evaluate', {
              expression: MEASURE_EXPR,
              returnByValue: true,
            });
            parsed = JSON.parse(result.value);
            if (
              prevHeights &&
              JSON.stringify(prevHeights) === JSON.stringify(parsed.h)
            ) {
              break;
            }
            prevHeights = parsed.h;
            await new Promise((r) => setTimeout(r, 400));
          }
          if (parsed.n !== item.n) {
            console.error(
              `[cv-worker] ${item.pageId} ${name}: DOM count ${parsed.n} != expected ${item.n}`
            );
          }
          per[name] = parsed.h;
        }
        results[item.pageId] = { mobile: per.mobile, desktop: per.desktop };
      } catch (err) {
        results[item.pageId] = null;
        console.error(`[cv-worker] ${item.pageId}: ${err.message}`);
      }
    }
    finish({ ok: true, results });
  } catch (err) {
    finish({ ok: false, error: String((err && err.message) || err) });
  } finally {
    if (ws) {
      try { ws.close(); } catch { /* already closed */ }
    }
    if (chrome) chrome.kill();
    if (server) server.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

process.on('uncaughtException', (err) =>
  finish({ ok: false, error: String((err && err.message) || err) })
);
main().catch((err) =>
  finish({ ok: false, error: String((err && err.message) || err) })
);
