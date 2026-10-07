import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { webpFacts } from '../scripts/lib/webp.mjs';
import {
  CAPTURES_PATH,
  MEDIA_FILE_ROUTE,
  RENDER_WIDTHS,
  SEED_MEDIA_BASE,
  approvedByFile,
  captureName,
  captureScheme,
  imageEndpointUrl,
  imageSrcset,
  isSeedMediaRef,
  publicMediaKey,
  resolveImageValue,
  resolveMediaSource,
  seedRefFile,
  storageKeyOf,
} from '../src/content/media.ts';

const manifest = JSON.parse(readFileSync(new URL('../seed/media.json', import.meta.url), 'utf8'));
const approved = approvedByFile(manifest);
const capturesDir = new URL('../public/screenshots/', import.meta.url);

/** The imagery truth rule for alt text: made-up data or the sign-in screen, never live, never the fixture code. */
export function honestAlt(alt) {
  return typeof alt === 'string' && /made.up|fixture|Sign in with GitHub/i.test(alt) && !/\blive\b/i.test(alt) && !/HK7N/.test(alt);
}

test('a capture file is named <capture>-light.webp or <capture>-dark.webp', () => {
  assert.equal(captureName('home-widgets-light.webp'), 'home-widgets');
  assert.equal(captureName('home-widgets-dark.webp'), 'home-widgets');
  assert.equal(captureName('repository-prs-dark.webp'), 'repository-prs');
  assert.equal(captureName('other.png'), 'other');
  assert.equal(captureScheme('tile-row-light.webp'), 'light');
  assert.equal(captureScheme('tile-row-dark.webp'), 'dark');
  assert.equal(captureScheme('tile-row.webp'), null);
});

test('a seed reference resolves to the repository capture with the recorded dimensions; a media value to the media-file route with its own', () => {
  const ref = { $media: { url: `${SEED_MEDIA_BASE}/home-widgets-light.webp`, alt: 'A made-up home screen' } };
  assert.equal(isSeedMediaRef(ref), true);
  assert.equal(seedRefFile(ref), 'home-widgets-light.webp');
  assert.equal(seedRefFile({ $media: { url: 'https://example.invalid/a/b%20c.webp?x=1#y' } }), 'b c.webp');
  assert.deepEqual(resolveMediaSource(ref, approved), { href: `${CAPTURES_PATH}/home-widgets-light.webp`, alt: 'A made-up home screen', width: 1080, height: 1920, name: 'home-widgets', kind: 'seed' });
  assert.deepEqual(resolveMediaSource({ $media: { url: `${SEED_MEDIA_BASE}/unknown.webp` } }), { href: `${CAPTURES_PATH}/unknown.webp`, alt: '', width: undefined, height: undefined, name: 'unknown', kind: 'seed' });
  const value = { id: '01A', provider: 'local', alt: 'alt', width: 1080, height: 1573, filename: 'pinned-widget-dark.webp', meta: { storageKey: '01A.webp' } };
  assert.deepEqual(resolveMediaSource(value), { href: `${MEDIA_FILE_ROUTE}01A.webp`, alt: 'alt', width: 1080, height: 1573, name: 'pinned-widget', kind: 'media' });
  assert.deepEqual(resolveMediaSource({ id: '01B', src: `${MEDIA_FILE_ROUTE}01B.webp`, width: 10.4, height: 0 }), { href: `${MEDIA_FILE_ROUTE}01B.webp`, alt: '', width: 10, height: undefined, name: '01B', kind: 'media' }, 'a key from a legacy src, dimensions rounded or dropped');
  assert.equal(storageKeyOf({ meta: { storageKey: '../x' } }), null);
  assert.equal(storageKeyOf({ meta: { storageKey: 'a/b.webp' } }), null);
  for (const nothing of [null, undefined, 'home-widgets', 7, {}, { id: '01C' }, { provider: 'external', id: '', src: 'https://example.invalid/x.webp' }, { $media: { url: ' ' } }, { $media: 'x' }]) {
    assert.equal(resolveMediaSource(nothing, approved), null, JSON.stringify(nothing));
  }
});

test('an image value resolves its primary and its dark variant in either shape; a missing primary means no figure', () => {
  const seedValue = { $media: { url: `${SEED_MEDIA_BASE}/tile-row-light.webp`, alt: 'a' }, darkVariant: { $media: { url: `${SEED_MEDIA_BASE}/tile-row-dark.webp`, alt: 'a' } } };
  const resolved = resolveImageValue(seedValue, approved);
  assert.equal(resolved.primary.href, `${CAPTURES_PATH}/tile-row-light.webp`);
  assert.equal(resolved.dark.href, `${CAPTURES_PATH}/tile-row-dark.webp`);
  assert.deepEqual([resolved.primary.width, resolved.primary.height, resolved.dark.height], [1080, 840, 840]);
  const mediaValue = { id: '01A', meta: { storageKey: '01A.webp' }, filename: 'tile-row-light.webp', darkVariant: { id: '01B', meta: { storageKey: '01B.webp' }, filename: 'tile-row-dark.webp' } };
  const resolvedMedia = resolveImageValue(mediaValue);
  assert.equal(resolvedMedia.primary.href, `${MEDIA_FILE_ROUTE}01A.webp`);
  assert.equal(resolvedMedia.dark.href, `${MEDIA_FILE_ROUTE}01B.webp`);
  assert.deepEqual(resolveImageValue({ id: '01A', meta: { storageKey: '01A.webp' } }).dark, null);
  assert.deepEqual(resolveImageValue({ darkVariant: mediaValue.darkVariant }), { primary: null, dark: null }, 'no primary, no figure');
  assert.deepEqual(resolveImageValue(undefined), { primary: null, dark: null });
});

test('every rendition goes through the image endpoint at the two widths', () => {
  assert.equal(imageEndpointUrl('/_image', '/screenshots/home-widgets-dark.webp', 540), '/_image?href=%2Fscreenshots%2Fhome-widgets-dark.webp&w=540&f=webp');
  assert.equal(imageEndpointUrl('/_image', `${MEDIA_FILE_ROUTE}01A.webp`, 1080, 'avif'), '/_image?href=%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01A.webp&w=1080&f=avif');
  assert.deepEqual(RENDER_WIDTHS, [540, 1080]);
  assert.equal(imageSrcset('/_image', '/screenshots/x.webp'), '/_image?href=%2Fscreenshots%2Fx.webp&w=540&f=webp 540w, /_image?href=%2Fscreenshots%2Fx.webp&w=1080&f=webp 1080w');
});

test('the public media route admits only a flat storage key', () => {
  assert.equal(publicMediaKey('/_emdash/api/media/file/01ARZ3NDEKTSV4RRFFQ69G5FAV.webp'), '01ARZ3NDEKTSV4RRFFQ69G5FAV.webp');
  assert.equal(publicMediaKey('/_emdash/api/media/file/a.b-c_d'), 'a.b-c_d');
  for (const path of ['/_emdash/api/media/file/', '/_emdash/api/media/file', '/_emdash/api/media/file/.', '/_emdash/api/media/file/..', '/_emdash/api/media/file/a/b', '/_emdash/api/media/file/a%2Fb', '/_emdash/api/media/file/a b', '/_emdash/api/media/01A', '/_emdash/api/media', '/_emdash/api/media/file/transfers/x']) {
    assert.equal(publicMediaKey(path), null, path);
  }
});

test('seed/media.json records exactly the captures under public/screenshots/, with their true facts and honest alt text, and docs/content.md records their hashes', () => {
  const files = readdirSync(capturesDir).filter((name) => name.endsWith('.webp')).sort();
  assert.deepEqual(manifest.approved.map((capture) => capture.file), files, 'the approved list is the directory, in order');
  assert.equal(manifest.base, SEED_MEDIA_BASE);
  const doc = readFileSync(new URL('../docs/content.md', import.meta.url), 'utf8');
  const captures = new Map();
  for (const capture of manifest.approved) {
    const facts = webpFacts(readFileSync(new URL(capture.file, capturesDir)));
    assert.deepEqual({ width: capture.width, height: capture.height, size: capture.size, sha256: capture.sha256, contentHash: capture.contentHash }, facts, `${capture.file}: the recorded facts are the file's`);
    assert.equal(capture.capture, captureName(capture.file));
    assert.equal(capture.scheme, captureScheme(capture.file));
    assert.ok(honestAlt(capture.alt), `${capture.file}: alt text says the data is made up (or shows the sign-in screen), never live, no fixture code: ${capture.alt}`);
    assert.ok(doc.includes(`\`${capture.file}\` | \`${capture.sha256}\``), `docs/content.md records the SHA-256 of ${capture.file}`);
    const entry = captures.get(capture.capture) ?? {};
    entry[capture.scheme] = capture;
    captures.set(capture.capture, entry);
  }
  for (const [name, cuts] of captures) {
    assert.ok(cuts.dark, `${name} has a dark cut`);
    if (cuts.light) {
      assert.deepEqual([cuts.light.width, cuts.light.height], [cuts.dark.width, cuts.dark.height], `${name}: the light cut has its dark cut's box`);
      assert.equal(cuts.light.alt, cuts.dark.alt, `${name}: one alt text for both cuts`);
    }
  }
  assert.equal(captures.size, 13, 'thirteen captures');
  assert.equal(manifest.approved.length, 25, 'twelve with a light cut, one dark only');
});

test('the mirrored library and usage follow the imagery rules: approved captures only on the pages, honest alt text, the locked dark pairing, every slot filled', (t) => {
  if (!manifest.library.length && !manifest.usage.length) {
    t.diagnostic('the mirror has not recorded the live library yet; nothing to judge');
    return;
  }
  const byHash = new Map(manifest.approved.map((capture) => [capture.contentHash, capture]));
  const byId = new Map(manifest.library.map((item) => [item.id, item]));
  const cuts = new Map();
  for (const capture of manifest.approved) cuts.set(capture.capture, { ...(cuts.get(capture.capture) ?? {}), [capture.scheme]: capture });
  for (const item of manifest.library) {
    assert.ok(/^[A-Za-z0-9._-]+$/.test(item.storageKey), `${item.id}: a flat storage key`);
    assert.equal(item.status, 'ready');
  }
  const slots = manifest.usage.filter((row) => row.type === 'hero' || row.type === 'feature');
  assert.ok(slots.length >= 1, 'the live pages have image slots');
  for (const row of manifest.usage) {
    const where = `${row.page}/${row.block}.${row.field}`;
    assert.ok(row.image, `${where}: the slot has an image (a block without one renders no figure)`);
    const item = byId.get(row.image.id);
    assert.ok(item, `${where}: references ${row.image.filename ?? row.image.id}, which the library has`);
    const capture = item.contentHash ? byHash.get(item.contentHash) : undefined;
    assert.ok(capture, `${where}: ${item.filename} is an approved capture (its content hash is recorded in seed/media.json)`);
    assert.ok(honestAlt(item.alt), `${where}: the library's alt text for ${item.filename} is honest: ${item.alt}`);
    assert.deepEqual([item.width, item.height], [capture.width, capture.height], `${where}: ${item.filename} keeps the capture's dimensions`);
    const pair = cuts.get(capture.capture);
    if (pair.light && pair.dark) {
      assert.equal(capture.scheme, 'light', `${where}: the primary is the light cut; the page follows the colour scheme (site-scheme-imagery-010)`);
      assert.ok(row.darkVariant, `${where}: the dark cut is the dark variant`);
      const dark = byId.get(row.darkVariant.id);
      assert.ok(dark && dark.contentHash === pair.dark.contentHash, `${where}: the dark variant is ${pair.dark.file}`);
    } else {
      assert.equal(row.darkVariant, null, `${where}: ${capture.capture} has no light cut and renders its dark cut alone`);
    }
  }
});
