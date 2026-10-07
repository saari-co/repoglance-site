import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startLocalWorker } from './lib/workerd.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
assert.ok(existsSync(join(root, 'dist/server/wrangler.json')), 'run npm run build first: dist/server/wrangler.json is missing');

const checks = [];
let worker;

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
// A rendition of a repository capture through the image endpoint, as the
// seed render writes it into the HTML (src/content/media.ts; & escaped).
const renditionUrl = (file, width) => `/_image?href=${encodeURIComponent(`/screenshots/${file}`)}&amp;w=${width}&amp;f=webp`;
const srcsetOf = (file) => `${renditionUrl(file, 540)} 540w, ${renditionUrl(file, 1080)} 1080w`;
const rendition = (body, file, width) => body.includes(renditionUrl(file, width));
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
  // A fresh throwaway state directory: the pages render from the seed on an empty D1.
  try {
    worker = await startLocalWorker({ root });
  } catch (error) {
    record('local workerd started', false, error instanceof Error ? error.message : String(error));
  }
  record('local workerd started', true);
  const { base, port } = worker;

  const home = await request(base, '/');
  const homeBody = await home.text();
  record('GET / is 200', home.status === 200, `status ${home.status}`);
  record('GET / is HTML', /text\/html/.test(home.headers.get('content-type') ?? ''), home.headers.get('content-type'));
  record('GET / renders from the seed on a fresh database', /data-content-source="seed"/.test(homeBody), homeBody.slice(0, 300));
  record('GET / carries the hero heading', homeBody.includes('Glance at the home screen. Know where your repos stand.'), '');
  record('GET / links to the testers page and the privacy policy', homeBody.includes('href="/testers"') && homeBody.includes('https://saari-co.github.io/RepoGlance/privacy/'), '');
  record('GET / shows the showcase captures with made-up data, through the image endpoint', rendition(homeBody, 'home-widgets-dark.webp', 540) && rendition(homeBody, 'signin-code-light.webp', 540) && (homeBody.match(/alt="[^"]*"/g) ?? []).every((alt) => /made.up|fixture|Sign in with GitHub/i.test(alt) && !/\blive\b/i.test(alt)), '');
  record('GET / has no scripts', !/<script/i.test(homeBody), 'script tag found');
  record('GET / inlines the brand mark', /<svg class="brand-mark"/.test(homeBody), 'inline mark missing');
  record('GET / has the band hero, the feature row and the band call to action', /class="band band-hero"/.test(homeBody) && /class="showcase"/.test(homeBody) && /class="band band-cta"/.test(homeBody) && (homeBody.match(/class="feature"/g) ?? []).length === 4, 'structure');
  record('GET / card images are the cut-outs the cards are about', /data-shot="pinned-widget"/.test(homeBody) && /data-shot="catalog-rows"/.test(homeBody) && /data-shot="tile-row"/.test(homeBody), 'card images');
  // Scheme-matched imagery (site-scheme-imagery-010) from media references
  // (media-library-014): every image is a <picture> with one dark-scheme
  // source, each candidate a rendition of the capture's light or dark cut
  // through the image endpoint. The home hero follows the band (dark cut by
  // default, light cut on the dark scheme); every other image follows the
  // page (light cut by default, dark cut on the dark scheme).
  const picture = (body, name) => body.match(new RegExp(`<figure class="shot" data-shot="${name}" data-scheme="(page|band|single)"><picture>(?:<source media="\\(prefers-color-scheme: dark\\)" srcset="([^"]+)" sizes="[^"]+">)?<img src="([^"]+)" srcset="([^"]+)" sizes="[^"]+" width="(\\d+)" height="(\\d+)"`));
  const follows = (body, name, policy) => {
    const m = picture(body, name);
    if (!m) return false;
    const [, scheme, darkSrcset, imgSrc, imgSrcset] = m;
    const onDark = policy === 'band' ? `${name}-light.webp` : `${name}-dark.webp`;
    const onLight = policy === 'band' ? `${name}-dark.webp` : `${name}-light.webp`;
    return scheme === policy && darkSrcset === srcsetOf(onDark) && imgSrc === renditionUrl(onLight, 540) && imgSrcset === srcsetOf(onLight);
  };
  record('GET / hero phone follows the band (dark cut, light cut on the dark scheme)', follows(homeBody, 'home-widgets', 'band'), (picture(homeBody, 'home-widgets') ?? ['no picture'])[0]);
  record('GET / card images follow the page (light cut, dark cut on the dark scheme)', ['pinned-widget', 'catalog-rows', 'tile-row', 'signin-code'].every((name) => follows(homeBody, name, 'page')), 'card pictures');
  record('GET / images carry the dimensions of their source and the media alt text', (picture(homeBody, 'home-widgets') ?? [])[5] === '1080' && (picture(homeBody, 'home-widgets') ?? [])[6] === '1920' && (picture(homeBody, 'pinned-widget') ?? [])[6] === '1573', 'dimensions');
  record('GET / has exactly five pictures, each with one source', (homeBody.match(/<picture>/g) ?? []).length === 5 && (homeBody.match(/<source /g) ?? []).length === 5, `${(homeBody.match(/<picture>/g) ?? []).length} pictures, ${(homeBody.match(/<source /g) ?? []).length} sources`);
  record('GET / serves no retired hand-cut width and no media-file route from the seed', !/screenshots\/[a-z-]+-(540|1080)\.webp/.test(homeBody) && !/_emdash\/api\/media/.test(homeBody), '');
  record('GET / canonical has no trailing slash', /<link rel="canonical" href="https:\/\/repoglance\.com\/"/.test(homeBody), '');
  record('GET / declares the Open Graph image, its size and a made-up-data alt', /property="og:image" content="https:\/\/repoglance\.com\/og-image\.png"/.test(homeBody) && /og:image:width" content="1200"/.test(homeBody) && /og:image:height" content="630"/.test(homeBody) && /og:image:alt" content="[^"]*made-up[^"]*"/.test(homeBody), '');
  expectCachedPage('GET /', home, 'astro-path:/');

  const testers = await request(base, '/testers');
  const testersBody = await testers.text();
  record('GET /testers is 200', testers.status === 200, `status ${testers.status}`);
  record('GET /testers renders from the seed', /data-content-source="seed"/.test(testersBody), '');
  record('GET /testers carries the Google Group link', testersBody.includes('https://groups.google.com/g/repoglance-testers'), '');
  record('GET /testers states the missing opt-in link', /opt-in link is not published yet/.test(testersBody), '');
  record('GET /testers has no Play URL', !/play\.google\.com/.test(testersBody), '');
  record('GET /testers hero phone follows the page (light cut, dark cut on the dark scheme)', follows(testersBody, 'signin-code', 'page') && (testersBody.match(/<picture>/g) ?? []).length === 1, (picture(testersBody, 'signin-code') ?? ['no picture'])[0]);
  record('GET /testers has the band hero, the closing band and the page attribute', /class="band band-hero"/.test(testersBody) && /class="band band-tail"/.test(testersBody) && /<html lang="en" data-page="testers"/.test(testersBody), 'structure');
  record('GET /testers canonical is /testers', /<link rel="canonical" href="https:\/\/repoglance\.com\/testers"/.test(testersBody), '');
  expectCachedPage('GET /testers', testers, 'astro-path:/testers');
  const slashed = await request(base, '/testers/');
  record('GET /testers/ canonicalises to /testers', slashed.status === 200 && /<link rel="canonical" href="https:\/\/repoglance\.com\/testers"/.test(await slashed.text()), `status ${slashed.status}`);

  for (const path of ['/_emdash', '/_emdash/', '/_emdash/admin', '/_emdash/admin/', '/_emdash/setup', '/_emdash/api/setup', '/_EMDASH/admin', '/_emdash//admin', '/%5Femdash/admin', '/_emdash/api/content']) {
    await expectDenied(base, path);
  }
  // The public media-file route (media-library-014): an anonymous GET or HEAD
  // of a flat storage key reaches EmDash (404 for a key the library does not
  // have, uncached); the media list, uploads, writes and every other form of
  // the path stay denied by the guard before EmDash sees them.
  for (const path of ['/_emdash/api/media', '/_emdash/api/media/file', '/_emdash/api/media/file/', '/_emdash/api/media/file/../x', '/_emdash/api/media/file/a%2Fb.webp', '/_emdash/api/media/file/a/b.webp', '/_EMDASH/api/media/file/01ABC.webp', '/_emdash/api/media/01ABC', '/_emdash/api/media/upload-url']) {
    await expectDenied(base, path);
  }
  await expectDenied(base, '/_emdash/api/media/file/01ABC.webp', { method: 'POST', headers: { 'content-type': 'application/json', 'x-emdash-request': '1' }, body: '{}' });
  for (const method of ['GET', 'HEAD']) {
    const missingFile = await request(base, '/_emdash/api/media/file/01ARZ3NDEKTSV4RRFFQ69G5FAV.webp', { method });
    const missingBody = await missingFile.text();
    record(`${method} /_emdash/api/media/file/<key> reaches EmDash anonymously`, missingFile.status === 404 && (missingFile.headers.get('content-type') ?? '').includes('application/json') && (method === 'HEAD' || /"NOT_FOUND"/.test(missingBody)), `status ${missingFile.status} ${missingFile.headers.get('content-type')} ${missingBody.slice(0, 80)}`);
    expectUncached(`${method} /_emdash/api/media/file/<key> (missing)`, missingFile.headers.get('cloudflare-cdn-cache-control'));
  }

  // The image endpoint serves every width from one source per capture and is
  // edge-cached like the pages (media-library-014); a foreign source is refused.
  const heroRendition = await request(base, renditionUrl('home-widgets-dark.webp', 540).replace(/&amp;/g, '&'));
  const heroBytes = Buffer.from(await heroRendition.arrayBuffer());
  record('GET /_image rendition of the hero is a WebP', heroRendition.status === 200 && (heroRendition.headers.get('content-type') ?? '').includes('image/webp') && heroBytes.toString('latin1', 0, 4) === 'RIFF' && heroBytes.toString('latin1', 8, 12) === 'WEBP', `${heroRendition.status} ${heroRendition.headers.get('content-type')} ${heroBytes.length} bytes`);
  const source = Buffer.from(await (await request(base, '/screenshots/home-widgets-dark.webp')).arrayBuffer());
  record('GET /_image rendition at 540 px is a resized copy, not the source', heroBytes.length > 0 && heroBytes.length < source.length && !heroBytes.equals(source), `${heroBytes.length} vs ${source.length} bytes`);
  record('GET /_image rendition is edge-cached like the pages and tagged media', heroRendition.headers.get('cloudflare-cdn-cache-control') === EDGE_POLICY && (heroRendition.headers.get('cache-tag') ?? '').split(',').map((tag) => tag.trim()).includes('media') && /^host$/i.test(heroRendition.headers.get('vary') ?? ''), `cdn ${heroRendition.headers.get('cloudflare-cdn-cache-control')} tags ${heroRendition.headers.get('cache-tag')} vary ${heroRendition.headers.get('vary')}`);
  const wide = await request(base, renditionUrl('home-widgets-dark.webp', 1080).replace(/&amp;/g, '&'));
  record('GET /_image rendition at 1080 px is served', wide.status === 200 && (wide.headers.get('content-type') ?? '').includes('image/webp'), `${wide.status}`);
  const again = await request(base, renditionUrl('home-widgets-dark.webp', 540).replace(/&amp;/g, '&'));
  record('GET /_image rendition answers the same way a second time (the adapter caches it)', again.status === 200 && Buffer.from(await again.arrayBuffer()).equals(heroBytes) && again.headers.get('cloudflare-cdn-cache-control') === EDGE_POLICY, `status ${again.status} cdn ${again.headers.get('cloudflare-cdn-cache-control')}`);
  // Only the site's own renditions are served: another width, format,
  // parameter or source answers the guard's 404, uncached, before the
  // endpoint transforms anything.
  for (const query of ['href=%2Fscreenshots%2Fhome-widgets-dark.webp&w=333&f=webp', 'href=%2Fscreenshots%2Fhome-widgets-dark.webp&w=0540&f=webp', 'href=%2Fscreenshots%2Fhome-widgets-dark.webp&w=5.4e2&f=webp', 'f=webp&w=540&href=%2Fscreenshots%2Fhome-widgets-dark.webp', 'href=%2Fscreenshots%2Fhome-widgets-dark.webp&w=540&f=avif', 'href=%2Fscreenshots%2Fhome-widgets-dark.webp&w=540&f=webp&q=100', 'href=%2Fscreenshots%2Fnothing.webp&w=540&f=webp', 'href=%2Fmark.svg&w=540&f=webp', 'href=https%3A%2F%2Fexample.com%2Fx.webp&w=540&f=webp', 'href=https%3A%2F%2Frepoglance.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01ARZ3NDEKTSV4RRFFQ69G5FAV.webp&w=400&f=webp', 'href=%2F_emdash%2Fapi%2Fmedia%2Ffile%2Fa%2Fb.webp&w=540&f=webp', '']) {
    await expectDenied(base, `/_image?${query}`);
  }
  await expectDenied(base, renditionUrl('home-widgets-dark.webp', 540).replace(/&amp;/g, '&'), { method: 'POST' });
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
    record(`host "${host}" is served, not redirected`, served.status === 200 && served.headers.location === undefined && /<html lang="en" data-page="home"/.test(served.body) && /data-content-source="seed"/.test(served.body), `status ${served.status} location ${served.headers.location}`);
  }
  const withCookie = await hostRequest(port, '/', 'repoglance.com', { cookie: 'CF_Authorization=forged; emdash-edit-mode=true' });
  record('GET / with cookies is served with the same edge policy (the Cookie variant keeps editors on fresh renders)', withCookie.status === 200 && withCookie.headers['cloudflare-cdn-cache-control'] === EDGE_POLICY && /\bcookie\b/i.test(withCookie.headers.vary ?? ''), `status ${withCookie.status} cdn ${withCookie.headers['cloudflare-cdn-cache-control']} vary ${withCookie.headers.vary}`);

  for (const [path, type] of [['/robots.txt', 'text/plain'], ['/sitemap.txt', 'text/plain'], ['/mark.svg', 'image/svg+xml'], ['/favicon.svg', 'image/svg+xml'], ['/screenshots/home-widgets-dark.webp', 'image/webp'], ['/screenshots/home-widgets-light.webp', 'image/webp'], ['/screenshots/signin-code-light.webp', 'image/webp'], ['/og-image.png', 'image/png']]) {
    const asset = await request(base, path);
    record(`GET ${path} is 200 ${type}`, asset.status === 200 && (asset.headers.get('content-type') ?? '').includes(type), `${asset.status} ${asset.headers.get('content-type')}`);
  }

  const ogImage = Buffer.from(await (await request(base, '/og-image.png')).arrayBuffer());
  const committed = await readFile(join(root, 'public/og-image.png'));
  record('GET /og-image.png is the committed 1200x630 PNG', ogImage.equals(committed) && ogImage.readUInt32BE(16) === 1200 && ogImage.readUInt32BE(20) === 630, `${ogImage.length} bytes served, ${committed.length} committed`);

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
  if (worker) await worker.stop();
}
