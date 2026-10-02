#!/usr/bin/env node
/**
 * Renders public/og-image.png, the Open Graph image (GrillTrack og-image-009,
 * design.md v4), from scripts/og-image/og-image.html through Google Chrome's
 * DevTools protocol at 1200x630, device scale factor 1. The eyebrow and the
 * hero line come from the home hero in seed/seed.json, so the copy lock stays
 * the single source. Development tooling, not part of `npm run verify`; needs
 * a local Google Chrome. The output depends on the machine's system faces
 * (docs/content.md records the faces, the Chrome build and the hash of the
 * committed file).
 *
 *   node scripts/og-image.mjs            # writes public/og-image.png
 *   node scripts/og-image.mjs --check    # renders to a temp file and compares
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const template = join(root, 'scripts/og-image/og-image.html');
const target = join(root, 'public/og-image.png');
const check = process.argv.includes('--check');
const chrome = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9633 + Math.floor(Math.random() * 500);
const profile = await mkdtemp(join(tmpdir(), 'repoglance-og-'));

const seed = JSON.parse(await readFile(join(root, 'seed/seed.json'), 'utf8'));
const hero = seed.content.pages.find((page) => page.slug === 'home').data.layout.find((block) => block._type === 'hero');
const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const html = (await readFile(template, 'utf8'))
  .replace(/(<p class="eyebrow" data-seed="eyebrow">)[^<]*(<\/p>)/, `$1${escape(hero.eyebrow)}$2`)
  .replace(/(<h1 data-seed="heading">)[^<]*(<\/h1>)/, `$1${escape(hero.heading)}$2`);

const child = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--force-color-profile=srgb', '--window-size=1200,630', 'about:blank',
], { stdio: 'ignore' });

async function endpoint() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
      const page = list.find((entry) => entry.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome not ready yet
    }
    await sleep(250);
  }
  throw new Error('Chrome DevTools endpoint did not come up');
}
function connect(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      id += 1;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  return new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve({ send, close: () => ws.close() }));
    ws.addEventListener('error', reject);
  });
}

const ready = `(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = r; i.onerror = r; })))); return [...document.images].every((i) => i.naturalWidth > 0); })()`;

try {
  const cdp = await connect(await endpoint());
  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  const { frameId } = await cdp.send('Page.navigate', { url: pathToFileURL(template).href });
  await sleep(300);
  await cdp.send('Page.setDocumentContent', { frameId, html });
  await sleep(300);
  const { result } = await cdp.send('Runtime.evaluate', { expression: ready, awaitPromise: true, returnByValue: true });
  if (result.value !== true) throw new Error('the widget image did not load');
  const { root: doc } = await cdp.send('DOM.getDocument', { depth: 1 });
  const faces = async (selector) => {
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.nodeId, selector });
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    return fonts.map((f) => `${f.familyName} (${f.postScriptName})`).join(', ');
  };
  const sans = await faces('h1');
  const mono = await faces('.eyebrow');
  await sleep(200);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 }, captureBeyondViewport: false });
  cdp.close();
  const bytes = Buffer.from(data, 'base64');
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const dims = `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
  if (check) {
    const committed = await readFile(target);
    const same = committed.equals(bytes);
    console.log(`rendered ${dims} ${bytes.length} bytes sha256 ${sha256}; committed sha256 ${createHash('sha256').update(committed).digest('hex')}; ${same ? 'identical' : 'DIFFERENT'}`);
    console.log(`faces: heading ${sans}; mono ${mono}`);
    process.exitCode = same ? 0 : 1;
  } else {
    await writeFile(target, bytes);
    console.log(`${target}: ${dims}, ${bytes.length} bytes, sha256 ${sha256}`);
    console.log(`faces: heading ${sans}; mono ${mono}`);
  }
} finally {
  child.kill('SIGKILL');
  await rm(profile, { recursive: true, force: true });
}
