import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { request as httpRequest } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const config = join(root, 'dist/server/wrangler.json');
assert.ok(existsSync(config), 'run npm run build first: dist/server/wrangler.json is missing');

const persistTo = await mkdtemp(join(tmpdir(), 'repoglance-site-smoke-'));
const checks = [];
let worker;

async function reservePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function startWorker(port) {
  const child = spawn(
    join(root, 'node_modules/.bin/wrangler'),
    ['dev', '--local', '--persist-to', persistTo, '--port', String(port), '--ip', '127.0.0.1', '--config', config],
    { cwd: root, env: { ...process.env, CI: '1' }, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let logs = '';
  const capture = (chunk) => {
    logs = (logs + chunk.toString()).slice(-100_000);
  };
  child.stdout.on('data', capture);
  child.stderr.on('data', capture);
  let exited = false;
  const exit = new Promise((resolve) => {
    child.once('exit', () => {
      exited = true;
      resolve();
    });
    child.once('error', (error) => {
      logs += String(error);
      exited = true;
      resolve();
    });
  });
  return { child, logs: () => logs, exited: () => exited, exit };
}

async function stopWorker() {
  if (!worker || worker.exited()) return;
  worker.child.kill('SIGTERM');
  await Promise.race([worker.exit, sleep(5000)]);
  if (!worker.exited()) {
    worker.child.kill('SIGKILL');
    await worker.exit;
  }
}

const request = (base, path, init = {}) =>
  fetch(base + path, { signal: AbortSignal.timeout(20000), redirect: 'manual', ...init });

/** A raw GET with an explicit Host header; fetch treats Host as forbidden. */
function hostRequest(port, path, host, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ host: '127.0.0.1', port, path, method: 'GET', headers: { host, ...extraHeaders } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.setTimeout(20000, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

// Edge cache policy for a rendered public page (src/page-cache.ts).
const EDGE_POLICY = 'public, max-age=300, stale-while-revalidate=60';
function expectCachedPage(label, response, pathTag) {
  const cdn = response.headers.get('cloudflare-cdn-cache-control');
  record(`${label} asks the edge to cache for five minutes with a one-minute stale window`, cdn === EDGE_POLICY, `cloudflare-cdn-cache-control ${cdn}`);
  const tags = (response.headers.get('cache-tag') ?? '').split(',').map((tag) => tag.trim());
  record(`${label} is tagged with the pages collection, its path and the Worker version`, tags.includes('pages') && tags.includes(pathTag) && tags.some((tag) => /^astro-version:.+/.test(tag)), `cache-tag ${response.headers.get('cache-tag')}`);
  record(`${label} carries a version-scoped weak ETag`, /^W\/"[^"]+:\d+"$/.test(response.headers.get('etag') ?? ''), `etag ${response.headers.get('etag')}`);
  const vary = response.headers.get('vary') ?? '';
  record(`${label} varies by host and cookie`, /\bhost\b/i.test(vary) && /\bcookie\b/i.test(vary), `vary ${vary}`);
  record(`${label} carries a validator and tells browsers to revalidate`, response.headers.get('last-modified') !== null && response.headers.get('cache-control') === 'no-cache', `last-modified ${response.headers.get('last-modified')} cache-control ${response.headers.get('cache-control')}`);
  record(`${label} sets no cookie`, response.headers.get('set-cookie') === null, `set-cookie ${response.headers.get('set-cookie')}`);
}
function expectUncached(label, cdn) {
  record(`${label} is not edge-cached`, cdn === 'no-store', `cloudflare-cdn-cache-control ${cdn}`);
}

async function waitReady(base) {
  for (let attempt = 0; attempt < 120 && !worker.exited(); attempt += 1) {
    try {
      await request(base, '/robots.txt');
      return true;
    } catch {
      await sleep(500);
    }
  }
  return false;
}

function record(name, ok, detail = '') {
  checks.push({ name, ok, detail });
  if (!ok) throw new Error(`${name}: ${detail}`);
}

async function expectDenied(base, path, init = {}) {
  const response = await request(base, path, init);
  const body = await response.text();
  const label = `${init.method ?? 'GET'} ${path}`;
  record(`${label} is 404`, response.status === 404, `status ${response.status}`);
  record(`${label} has no redirect`, response.headers.get('location') === null, `location ${response.headers.get('location')}`);
  record(`${label} serves no admin or setup HTML`, !/_emdash\/admin|passkey|setup|<script/i.test(body) && body.length < 2000, `body ${body.slice(0, 120)}`);
  expectUncached(label, response.headers.get('cloudflare-cdn-cache-control'));
}

try {
  const port = await reservePort();
  const base = `http://127.0.0.1:${port}`;
  worker = startWorker(port);
  record('local workerd started', await waitReady(base), worker.logs().slice(-2000));

  const home = await request(base, '/');
  const homeBody = await home.text();
  record('GET / is 200', home.status === 200, `status ${home.status}`);
  record('GET / is HTML', /text\/html/.test(home.headers.get('content-type') ?? ''), home.headers.get('content-type'));
  record('GET / renders from the seed on a fresh database', /data-content-source="seed"/.test(homeBody), homeBody.slice(0, 300));
  record('GET / carries the hero heading', homeBody.includes('Your GitHub repos, at a glance, on your Pixel home screen.'), '');
  record('GET / links to the testers page and the privacy policy', homeBody.includes('href="/testers"') && homeBody.includes('https://saari-co.github.io/RepoGlance/privacy/'), '');
  record('GET / shows only sample-mode captures', /\/screenshots\/home-widgets-540\.webp/.test(homeBody) && !/live/i.test(homeBody.match(/alt="[^"]*"/g)?.join(' ') ?? ''), '');
  record('GET / has no scripts', !/<script/i.test(homeBody), 'script tag found');
  record('GET / inlines the brand mark', /<svg class="brand-mark"/.test(homeBody), 'inline mark missing');
  record('GET / has the band hero, the feature row and the band call to action', /class="band band-hero"/.test(homeBody) && /class="showcase"/.test(homeBody) && /class="band band-cta"/.test(homeBody) && (homeBody.match(/class="feature"/g) ?? []).length === 4, 'structure');
  record('GET / canonical has no trailing slash', /<link rel="canonical" href="https:\/\/repoglance\.com\/"/.test(homeBody), '');
  expectCachedPage('GET /', home, 'astro-path:/');

  const testers = await request(base, '/testers');
  const testersBody = await testers.text();
  record('GET /testers is 200', testers.status === 200, `status ${testers.status}`);
  record('GET /testers renders from the seed', /data-content-source="seed"/.test(testersBody), '');
  record('GET /testers carries the Google Group link', testersBody.includes('https://groups.google.com/g/repoglance-testers'), '');
  record('GET /testers states the missing opt-in link', /opt-in link is not published yet/.test(testersBody), '');
  record('GET /testers has no Play URL', !/play\.google\.com/.test(testersBody), '');
  record('GET /testers has the band hero, the closing band and the page attribute', /class="band band-hero"/.test(testersBody) && /class="band band-tail"/.test(testersBody) && /<html lang="en" data-page="testers"/.test(testersBody), 'structure');
  record('GET /testers canonical is /testers', /<link rel="canonical" href="https:\/\/repoglance\.com\/testers"/.test(testersBody), '');
  expectCachedPage('GET /testers', testers, 'astro-path:/testers');
  const slashed = await request(base, '/testers/');
  record('GET /testers/ canonicalises to /testers', slashed.status === 200 && /<link rel="canonical" href="https:\/\/repoglance\.com\/testers"/.test(await slashed.text()), `status ${slashed.status}`);

  for (const path of ['/_emdash', '/_emdash/', '/_emdash/admin', '/_emdash/admin/', '/_emdash/setup', '/_emdash/api/setup', '/_EMDASH/admin', '/_emdash//admin', '/%5Femdash/admin', '/_emdash/api/media/file/anything', '/_emdash/api/content']) {
    await expectDenied(base, path);
  }
  await expectDenied(base, '/_emdash/api/setup', { method: 'POST', headers: { 'content-type': 'application/json', origin: base, host: 'repoglance.com', 'x-forwarded-host': 'repoglance.com', cookie: 'CF_Authorization=forged' }, body: '{}' });
  await expectDenied(base, '/_emdash/admin', { headers: { 'cf-access-jwt-assertion': 'forged', cookie: 'CF_Authorization=forged' } });

  const missing = await request(base, '/nothing-here');
  record('GET /nothing-here is 404', missing.status === 404, `status ${missing.status}`);
  record('GET /nothing-here renders the site 404 page', /There is no page at this address/.test(await missing.text()), '');
  expectUncached('GET /nothing-here', missing.headers.get('cloudflare-cdn-cache-control'));

  // The www host is a pure redirector: every path, /_emdash included (Access
  // covers both hosts), answers a bodiless 301 to the same path and query on
  // the apex, and the redirect itself is never edge-cached.
  for (const [path, target] of [
    ['/', 'https://repoglance.com/'],
    ['/testers?x=1&y=2', 'https://repoglance.com/testers?x=1&y=2'],
    ['/_emdash/admin', 'https://repoglance.com/_emdash/admin'],
    ['/nothing-here', 'https://repoglance.com/nothing-here'],
  ]) {
    const redirected = await hostRequest(port, path, 'www.repoglance.com');
    record(`www ${path} is 301`, redirected.status === 301, `status ${redirected.status}`);
    record(`www ${path} points at the apex`, redirected.headers.location === target, `location ${redirected.headers.location}`);
    record(`www ${path} has no body`, redirected.body === '', `${redirected.body.length} bytes`);
    expectUncached(`www ${path}`, redirected.headers['cloudflare-cdn-cache-control']);
  }
  for (const host of ['WWW.RepoGlance.com', 'www.repoglance.com:8787', 'www.repoglance.com.']) {
    const redirected = await hostRequest(port, '/testers', host);
    record(`www host "${host}" is 301 to the apex`, redirected.status === 301 && redirected.headers.location === 'https://repoglance.com/testers', `status ${redirected.status} location ${redirected.headers.location}`);
  }
  for (const host of ['repoglance.com', 'www.repoglance.com.evil.example', 'wwww.repoglance.com']) {
    const served = await hostRequest(port, '/', host);
    record(`host "${host}" is served, not redirected`, served.status === 200 && served.headers.location === undefined && served.body.includes('Your GitHub repos, at a glance, on your Pixel home screen.'), `status ${served.status} location ${served.headers.location}`);
  }
  const withCookie = await hostRequest(port, '/', 'repoglance.com', { cookie: 'CF_Authorization=forged; emdash-edit-mode=true' });
  record('GET / with cookies is served with the same edge policy (the Cookie variant keeps editors on fresh renders)', withCookie.status === 200 && withCookie.headers['cloudflare-cdn-cache-control'] === EDGE_POLICY && /\bcookie\b/i.test(withCookie.headers.vary ?? ''), `status ${withCookie.status} cdn ${withCookie.headers['cloudflare-cdn-cache-control']} vary ${withCookie.headers.vary}`);

  for (const [path, type] of [['/robots.txt', 'text/plain'], ['/sitemap.txt', 'text/plain'], ['/mark.svg', 'image/svg+xml'], ['/favicon.svg', 'image/svg+xml'], ['/screenshots/home-widgets-540.webp', 'image/webp'], ['/og-image.png', 'image/png']]) {
    const asset = await request(base, path);
    record(`GET ${path} is 200 ${type}`, asset.status === 200 && (asset.headers.get('content-type') ?? '').includes(type), `${asset.status} ${asset.headers.get('content-type')}`);
  }

  const summary = { at: new Date().toISOString(), checks };
  const outDir = join(root, 'runs/smoke-runs');
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'last.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`Smoke passed: ${checks.length} checks against local workerd on ${base}.`);
} catch (error) {
  console.error(error);
  if (worker) console.error(worker.logs().slice(-4000));
  process.exitCode = 1;
} finally {
  await stopWorker();
  await rm(persistTo, { recursive: true, force: true });
}
