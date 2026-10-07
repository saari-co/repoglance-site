import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { canonicalPage, mirrorPages, pageDifferences, seedPageData, serializeSeed } from '../src/content/cms-shape.ts';

const seed = JSON.parse(readFileSync(new URL('../seed/seed.json', import.meta.url), 'utf8'));
const liveFromSeed = () => seed.content.pages.map((page) => ({ slug: page.slug, data: structuredClone(page.data) }));

test('the repository equals the live CMS when every published page carries the seed data, whatever the block versions say', () => {
  const live = liveFromSeed();
  live[0].data.layout = live[0].data.layout.map((block) => ({ ...block, _version: 2 }));
  assert.deepEqual(pageDifferences(seed, live), []);
  assert.equal(serializeSeed(mirrorPages(seed, live)), serializeSeed(seed), 'a mirror of an equal CMS reproduces the seed byte for byte');
});

test('an admin edit shows as a content difference with the changed paths', () => {
  const live = liveFromSeed();
  live[0].data.layout[0].heading = 'A new heading written in the admin';
  live[1].data.description = 'A new description';
  const differences = pageDifferences(seed, live);
  assert.deepEqual(differences.map((difference) => [difference.slug, difference.kind]), [['home', 'content'], ['testers', 'content']]);
  assert.match(differences[0].detail, /layout\[0\]\.heading/);
  assert.match(differences[1].detail, /description/);
});

test('the mirrored seed keeps the repository order and structure and writes blocks at version 1 with their keys', () => {
  const live = liveFromSeed().reverse();
  live[1].data.layout = live[1].data.layout.map((block) => ({ ...block, _version: 3 }));
  live[1].data.layout[0].heading = 'Edited';
  live[1].data.extra_cms_field = 'ignored: the repository declares the fields';
  const mirrored = mirrorPages(seed, live);
  assert.deepEqual(mirrored.content.pages.map((page) => page.slug), ['home', 'testers'], 'repository order wins');
  assert.equal(mirrored.blockTypes, seed.blockTypes, 'structure untouched');
  assert.equal(mirrored.collections, seed.collections);
  const home = mirrored.content.pages[0];
  assert.equal(home.status, 'published');
  assert.equal(home.data.layout[0].heading, 'Edited');
  assert.ok(home.data.layout.every((block) => block._version === 1));
  assert.deepEqual(Object.keys(home.data.layout[0]).slice(0, 3), ['_type', '_version', '_key']);
  assert.equal('extra_cms_field' in home.data, false);
});

test('a page unpublished in the admin becomes a draft in the seed and keeps its last data; a new live page is appended', () => {
  const live = liveFromSeed().filter((page) => page.slug !== 'testers');
  live.push({ slug: 'about', data: { title: 'About', description: 'd', layout: [{ _type: 'hero', _version: 2, _key: 'about-hero', heading: 'h', lead: 'l' }] } });
  const mirrored = mirrorPages(seed, live);
  assert.deepEqual(mirrored.content.pages.map((page) => [page.slug, page.status]), [['home', 'published'], ['testers', 'draft'], ['about', 'published']]);
  assert.deepEqual(mirrored.content.pages[1].data, seed.content.pages[1].data, 'the retired page keeps its last data');
  const differences = pageDifferences(seed, live);
  assert.deepEqual(differences.map((difference) => [difference.slug, difference.kind]), [['testers', 'missing-in-cms'], ['about', 'missing-in-repo']]);
});

test('seedPageData and canonicalPage ignore _version and unknown fields but keep everything else', () => {
  const data = { title: 't', description: 'd', layout: [{ _type: 'cta', _version: 5, _key: 'k', heading: 'h', link_href: '/x' }], stray: 1 };
  assert.deepEqual(seedPageData(data, ['title', 'description', 'layout']), { title: 't', description: 'd', layout: [{ _type: 'cta', _version: 1, _key: 'k', heading: 'h', link_href: '/x' }] });
  assert.deepEqual(canonicalPage(data), canonicalPage({ ...data, layout: [{ ...data.layout[0], _version: 1 }] }));
});

// Decision media-library-014: image fields and the media manifest.
import { imageFieldsOf, manifestDifferences, mediaReference, mediaUsageOf, mirrorManifest, seedImageValue, serializeManifest } from '../src/content/cms-shape.ts';
import { SEED_MEDIA_BASE } from '../src/content/media.ts';

const manifest = JSON.parse(readFileSync(new URL('../seed/media.json', import.meta.url), 'utf8'));

/** The live pages of a CMS bootstrapped from the seed: every $media reference became a local media value, and the library holds the files. */
function liveWithMedia() {
  const library = [];
  const ids = new Map();
  const item = (ref) => {
    const file = ref.$media.url.split('/').pop();
    if (!ids.has(file)) {
      const capture = manifest.approved.find((entry) => entry.file === file);
      const id = `01MEDIA${String(ids.size).padStart(3, '0')}`;
      ids.set(file, id);
      library.push({ id, filename: file, mimeType: 'image/webp', size: capture.size, width: capture.width, height: capture.height, alt: capture.alt, contentHash: capture.contentHash, storageKey: `${id}.webp`, status: 'ready', authorId: 'someone' });
    }
    const id = ids.get(file);
    return { id, provider: 'local', alt: ref.$media.alt, width: 1080, height: 1920, filename: file, mimeType: 'image/webp', meta: { storageKey: `${id}.webp` } };
  };
  const live = seed.content.pages.map((page) => ({
    slug: page.slug,
    data: {
      ...structuredClone(page.data),
      layout: page.data.layout.map((block) => {
        if (!block.image) return { ...block, _version: 3 };
        const value = item(block.image);
        if (block.image.darkVariant) value.darkVariant = item(block.image.darkVariant);
        return { ...block, _version: 3, image: value };
      }),
    },
  }));
  return { live, library, mediaById: new Map(library.map((entry) => [entry.id, entry])) };
}

test('the image fields are the hero and feature image, and a live media value becomes the $media reference the seed carries', () => {
  assert.deepEqual([...imageFieldsOf(seed)], [['hero', ['image']], ['feature', ['image']]]);
  const { library, mediaById } = liveWithMedia();
  const light = library.find((entry) => entry.filename === 'home-widgets-light.webp');
  const dark = library.find((entry) => entry.filename === 'home-widgets-dark.webp');
  const value = { id: light.id, alt: 'snapshot alt', width: 1080, height: 1920, meta: { storageKey: light.storageKey }, darkVariant: { id: dark.id, meta: { storageKey: dark.storageKey } } };
  assert.deepEqual(seedImageValue(value, { mediaById }), {
    $media: { url: `${SEED_MEDIA_BASE}/home-widgets-light.webp`, alt: light.alt },
    darkVariant: { $media: { url: `${SEED_MEDIA_BASE}/home-widgets-dark.webp`, alt: dark.alt } },
  }, 'the library names the file and the alt text');
  assert.deepEqual(seedImageValue({ id: 'gone', alt: 'snapshot alt', filename: 'kept.webp', meta: { storageKey: '01X.webp' } }, { mediaById }), { $media: { url: `${SEED_MEDIA_BASE}/kept.webp`, alt: 'snapshot alt' } }, 'an item the library no longer has keeps its snapshot');
  assert.deepEqual(seedImageValue({ id: 'gone', meta: { storageKey: '01X.webp' } }, { base: 'https://cdn.example.invalid/m/' }), { $media: { url: 'https://cdn.example.invalid/m/01X.webp' } });
  assert.equal(seedImageValue({ provider: 'external', id: '', src: 'https://example.invalid/x.webp' }), undefined, 'an external URL is not a library file');
  assert.equal(seedImageValue({ alt: 'nothing to serve' }), undefined);
  assert.equal(seedImageValue('home-widgets'), undefined, 'a legacy slug is not an image');
  const ref = { $media: { url: 'https://example.invalid/a.webp', alt: 'a', filename: 'ignored' }, darkVariant: { $media: { url: 'https://example.invalid/b.webp' } } };
  assert.deepEqual(seedImageValue(ref), { $media: { url: 'https://example.invalid/a.webp', alt: 'a' }, darkVariant: { $media: { url: 'https://example.invalid/b.webp' } } }, 'a seed reference passes through');
  assert.deepEqual(mediaReference(value, mediaById), { id: light.id, filename: 'home-widgets-light.webp' });
  assert.deepEqual(mediaReference({ provider: 'external', id: '', src: 'https://example.invalid/x.webp' }), { id: '', filename: null });
  assert.deepEqual(mediaReference(ref), { id: '', filename: 'a.webp' });
  assert.equal(mediaReference(undefined), null);
});

test('a CMS whose media values point at the approved captures mirrors back to the seed byte for byte; an image swap is a content difference', () => {
  const { live, mediaById } = liveWithMedia();
  assert.deepEqual(pageDifferences(seed, live, 'pages', { mediaById }), []);
  assert.equal(serializeSeed(mirrorPages(seed, live, 'pages', { mediaById })), serializeSeed(seed));
  const swapped = structuredClone(live);
  const other = [...mediaById.values()].find((entry) => entry.filename === 'catalog-rows-light.webp');
  swapped[0].data.layout[0].image = { id: other.id, meta: { storageKey: other.storageKey } };
  const differences = pageDifferences(seed, swapped, 'pages', { mediaById });
  assert.deepEqual(differences.map((difference) => [difference.slug, difference.kind]), [['home', 'content']]);
  assert.match(differences[0].detail, /layout\[0\]\.image\.\$media\.url/);
  assert.match(differences[0].detail, /layout\[0\]\.image\.darkVariant/);
  const mirrored = mirrorPages(seed, swapped, 'pages', { mediaById });
  assert.deepEqual(mirrored.content.pages[0].data.layout[0].image, { $media: { url: `${SEED_MEDIA_BASE}/catalog-rows-light.webp`, alt: other.alt } });
  assert.deepEqual(Object.keys(mirrored.content.pages[0].data.layout[0]).slice(0, 3), ['_type', '_version', '_key']);
});

test('the manifest records the sorted library without authors and which block uses which item; the approved captures stay the repository\'s', () => {
  const { live, library } = liveWithMedia();
  const after = mirrorManifest(manifest, [...library].reverse(), live, seed);
  assert.deepEqual(Object.keys(after), ['base', 'approved', 'library', 'usage']);
  assert.equal(after.base, manifest.base);
  assert.equal(after.approved, manifest.approved);
  assert.deepEqual(after.library.map((item) => item.filename), library.map((item) => item.filename).sort());
  assert.ok(after.library.every((item) => !('authorId' in item)));
  assert.deepEqual(Object.keys(after.library[0]), ['id', 'filename', 'mimeType', 'size', 'width', 'height', 'alt', 'contentHash', 'storageKey', 'status']);
  assert.equal(after.usage.length, 6);
  assert.deepEqual(after.usage.map((row) => `${row.page}/${row.block}`), ['home/home-hero', 'home/home-pin', 'home/home-navigator', 'home/home-widgets', 'home/home-sample', 'testers/testers-hero']);
  const hero = after.usage[0];
  assert.deepEqual(hero, { page: 'home', block: 'home-hero', type: 'hero', field: 'image', image: { id: hero.image.id, filename: 'home-widgets-light.webp' }, darkVariant: { id: hero.darkVariant.id, filename: 'home-widgets-dark.webp' } });
  const empty = structuredClone(live);
  delete empty[0].data.layout[0].image;
  assert.deepEqual(mediaUsageOf(seed, empty)[0].image, null, 'a block without an image records null, which the audit flags');
  assert.equal(serializeManifest(after).endsWith('\n'), true);
  const lines = manifestDifferences(manifest, after);
  assert.ok(lines.some((line) => /^library: .* home-widgets-light\.webp added$/.test(line)), lines.join('\n'));
  assert.ok(lines.some((line) => line === `usage: home/home-hero.image now home-widgets-light.webp with dark variant home-widgets-dark.webp`), lines.join('\n'));
  assert.deepEqual(manifestDifferences(after, after), []);
  const changed = structuredClone(after);
  changed.library[0].alt = 'edited';
  changed.usage.pop();
  const again = manifestDifferences(after, changed);
  assert.ok(again.some((line) => /changed \(alt\)/.test(line)));
  assert.ok(again.some((line) => /^usage: testers\/testers-hero\.image gone$/.test(line)));
});
