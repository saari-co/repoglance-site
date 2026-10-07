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
