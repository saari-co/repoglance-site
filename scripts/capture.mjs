#!/usr/bin/env node
/**
 * Development-only page capture through Chrome's DevTools protocol, so both
 * colour schemes and real viewport widths are rendered faithfully. Not part of
 * `npm run verify`; needs a local Google Chrome.
 *
 *   node scripts/capture.mjs <base-url> <out-dir> [path ...]
 *
 * Writes <page>-<scheme>-<width>.png for each path at 375 and 1280 px, light
 * and dark. FULL_PAGE=1 captures the whole document height instead of the
 * viewport. Output belongs under ignored runs/.
 */
import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const [base, outDir, ...paths] = process.argv.slice(2);
if (!base || !outDir) {
  console.error('usage: node scripts/capture.mjs <base-url> <out-dir> [path ...]');
  process.exit(2);
}
const pages = paths.length ? paths : ['/', '/testers'];
const chrome = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9333 + Math.floor(Math.random() * 500);
const profile = join(process.env.TMPDIR ?? '/tmp', `repoglance-site-capture-${process.pid}`);
const viewports = [
  { width: 375, height: 812, mobile: true },
  { width: 1280, height: 900, mobile: false },
];
const schemes = ['light', 'dark'];

const child = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--force-color-profile=srgb', '--window-size=1280,900', 'about:blank',
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

try {
  await mkdir(outDir, { recursive: true });
  const cdp = await connect(await endpoint());
  await cdp.send('Page.enable');
  for (const path of pages) {
    const name = path === '/' ? 'index' : path.replace(/^\//, '').replace(/[^a-z0-9-]+/gi, '-');
    for (const scheme of schemes) {
      for (const viewport of viewports) {
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
        await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
        await cdp.send('Page.navigate', { url: new URL(path, base).href });
        await sleep(1500);
        if (process.env.FULL_PAGE === '1') {
          const { result } = await cdp.send('Runtime.evaluate', { expression: 'Math.ceil(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight))', returnByValue: true });
          const height = Math.min(Math.max(viewport.height, Number(result.value) || viewport.height), 12000);
          await cdp.send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height, deviceScaleFactor: 1, mobile: viewport.mobile });
          await sleep(300);
        }
        const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        const file = join(outDir, `${name}-${scheme}-${viewport.width}.png`);
        await writeFile(file, Buffer.from(data, 'base64'));
        console.log(file);
      }
    }
  }
  cdp.close();
} finally {
  child.kill('SIGKILL');
  await rm(profile, { recursive: true, force: true });
}
