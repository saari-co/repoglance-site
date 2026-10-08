import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { isSeedMediaRef, seedRefFile } from '../src/content/media.ts';

const seed = JSON.parse(readFileSync(new URL('../seed/seed.json', import.meta.url), 'utf8'));
const pages = seed.content.pages;
const home = pages.find((page) => page.slug === 'home');
const testers = pages.find((page) => page.slug === 'testers');

const PRIVACY_URL = 'https://saari-co.github.io/RepoGlance/privacy/';
const GROUP_URL = 'https://groups.google.com/g/repoglance-testers';
const REPO_URL = 'https://github.com/saari-co/RepoGlance';
const ISSUES_URL = 'https://github.com/saari-co/RepoGlance/issues';

function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => strings(item, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => strings(item, out));
  return out;
}
const allText = strings(seed.content);

test('the seed validates with EmDash when its validator is importable', async (t) => {
  let validateSeed;
  try {
    ({ validateSeed } = await import('emdash/seed'));
  } catch (error) {
    t.skip(`emdash/seed not importable under plain Node: ${error.message}`);
    return;
  }
  const result = validateSeed(seed);
  assert.equal(result.valid, true, JSON.stringify(result, null, 2));
  assert.deepEqual(result.errors, []);
});

test('exactly the two decided pages exist and are published', () => {
  assert.deepEqual(pages.map((page) => page.slug).sort(), ['home', 'testers']);
  for (const page of pages) {
    assert.equal(page.status, 'published');
    assert.ok(page.data.title && page.data.description, `${page.slug} has title and description`);
    assert.ok(Array.isArray(page.data.layout) && page.data.layout.length > 0, `${page.slug} has blocks`);
  }
});

test('block keys are unique and types are declared', () => {
  const declared = new Set(seed.blockTypes.map((type) => type.slug));
  const keys = new Set();
  for (const page of pages) {
    for (const block of page.data.layout) {
      assert.ok(declared.has(block._type), `${page.slug}: block type ${block._type} is declared`);
      assert.equal(block._version, 1);
      assert.ok(!keys.has(block._key), `duplicate block key ${block._key}`);
      keys.add(block._key);
    }
  }
});

test('home opens with a hero and ends with the testers call to action', () => {
  const layout = home.data.layout;
  assert.equal(layout[0]._type, 'hero');
  assert.equal(layout[0].primary_href, '/testers');
  assert.equal(layout.at(-1)._type, 'cta');
  assert.equal(layout.at(-1).link_href, '/testers');
});

test('testers page carries the Google Group link and three steps', () => {
  const steps = testers.data.layout.find((block) => block._type === 'steps');
  assert.ok(steps, 'steps block present');
  assert.equal(steps.steps.length, 3);
  assert.equal(steps.steps[0].link_href, GROUP_URL);
  const hero = testers.data.layout[0];
  assert.equal(hero._type, 'hero');
  assert.equal(hero.primary_href, GROUP_URL);
});

test('every link in the seed is site-relative or https', () => {
  for (const page of pages) {
    for (const block of page.data.layout) {
      const links = [block.primary_href, block.secondary_href, block.link_href, ...(Array.isArray(block.steps) ? block.steps.map((step) => step.link_href) : [])].filter(Boolean);
      for (const href of links) {
        assert.ok(/^(\/(?!\/)|https:\/\/)/.test(href), `${block._key}: ${href}`);
      }
    }
  }
});

test('required links are present and no Play opt-in URL is guessed', () => {
  const joined = allText.join('\n');
  for (const url of [PRIVACY_URL, GROUP_URL, REPO_URL, ISSUES_URL]) {
    assert.ok(joined.includes(url), `includes ${url}`);
  }
  assert.ok(!/play\.google\.com/i.test(joined), 'no Play URL until Console shows the opt-in link');
  assert.ok(/opt-in link is not published yet/i.test(joined), 'the missing opt-in link is stated');
});

test('copy follows the honest-main rules', () => {
  for (const text of allText) {
    assert.ok(!/\bstack\b/i.test(text), `no "stack" as a widget name: ${text}`);
    if (/\bCI\b/.test(text)) {
      assert.ok(/not yet/i.test(text) || /does not fetch/i.test(text), `CI is only mentioned as not yet: ${text}`);
    }
    assert.ok(!/live notification/i.test(text), `no watched-run notification claim: ${text}`);
    assert.ok(!/\bproduction\b/i.test(text), `no production-release claim: ${text}`);
  }
  const joined = allText.join('\n');
  assert.ok(/read-only/i.test(joined));
  assert.ok(/never changes anything on GitHub/i.test(joined));
  assert.ok(/0\.4\.0-beta\.1/.test(joined), 'the build version is named');
  assert.ok(/not affiliated/i.test(readFileSync(new URL('../src/layouts/Site.astro', import.meta.url), 'utf8')));
});

const manifest = JSON.parse(readFileSync(new URL('../seed/media.json', import.meta.url), 'utf8'));
const approvedCaptures = new Map(manifest.approved.map((capture) => [capture.file, capture]));

test('the hero and feature block types carry an image field with a dark variant in place of the screenshot select', () => {
  for (const slug of ['hero', 'feature']) {
    const fields = seed.blockTypes.find((type) => type.slug === slug).versions[0].fields;
    assert.ok(!fields.some((field) => field.slug === 'screenshot'), `${slug}: the screenshot select is gone (media-library-014)`);
    const image = fields.find((field) => field.slug === 'image');
    assert.ok(image, `${slug}: an image field`);
    assert.equal(image.type, 'image');
    assert.deepEqual(image.options, { darkVariant: true });
    assert.notEqual(image.required, true, 'a block without an image renders no figure');
  }
  for (const type of seed.blockTypes) {
    if (type.slug === 'hero' || type.slug === 'feature') continue;
    assert.ok(!type.versions[0].fields.some((field) => field.type === 'image'), `${type.slug} has no image field`);
  }
});

test('every image in the seed is a $media reference to an approved capture on main, with its alt text and the locked dark pairing', () => {
  let slots = 0;
  for (const page of pages) {
    for (const block of page.data.layout) {
      assert.ok(!('screenshot' in block), `${block._key}: no legacy slug`);
      if (block._type !== 'hero' && block._type !== 'feature') {
        assert.ok(!('image' in block), `${block._key}: no image on a ${block._type}`);
        continue;
      }
      if (!('image' in block)) continue;
      slots += 1;
      const image = block.image;
      assert.ok(isSeedMediaRef(image), `${block._key}: the image is a $media reference`);
      const file = seedRefFile(image);
      assert.equal(image.$media.url, `${manifest.base}/${file}`, `${block._key}: the reference is the repository's capture on main`);
      const capture = approvedCaptures.get(file);
      assert.ok(capture, `${block._key}: ${file} is an approved capture`);
      assert.equal(image.$media.alt, capture.alt, `${block._key}: the reference carries the capture's alt text`);
      assert.deepEqual(Object.keys(image.$media).sort(), ['alt', 'url']);
      const light = `${capture.capture}-light.webp`;
      const dark = `${capture.capture}-dark.webp`;
      if (approvedCaptures.has(light) && approvedCaptures.has(dark)) {
        assert.equal(file, light, `${block._key}: the primary is the light cut, the page follows the colour scheme (site-scheme-imagery-010)`);
        assert.ok(isSeedMediaRef(image.darkVariant), `${block._key}: the dark cut is the dark variant`);
        assert.equal(seedRefFile(image.darkVariant), dark);
        assert.equal(image.darkVariant.$media.url, `${manifest.base}/${dark}`);
        assert.equal(image.darkVariant.$media.alt, capture.alt);
        assert.deepEqual(Object.keys(image).sort(), ['$media', 'darkVariant']);
      } else {
        assert.equal(file, dark, `${block._key}: a capture without a light cut renders its dark cut alone`);
        assert.equal('darkVariant' in image, false);
      }
    }
  }
  assert.equal(slots, 6, 'the two heroes and the four cards carry an image');
  for (const text of allText) {
    assert.ok(!/HK7N/.test(text), 'the fixture code stays out of the copy and the alt text');
  }
});

test('the hero image follows the band on the home page and the page elsewhere; every other image follows the page', () => {
  const shot = readFileSync(new URL('../src/components/Screenshot.astro', import.meta.url), 'utf8');
  assert.match(shot, /<source media="\(prefers-color-scheme: dark\)"/, 'Screenshot.astro renders a dark-scheme source');
  assert.match(shot, /scheme = 'page'/, "Screenshot.astro follows the page unless told otherwise");
  assert.match(shot, /resolveImageValue\(image/, 'Screenshot.astro renders from the media reference');
  assert.match(shot, /\|\| heading/, 'the alt text falls back to the block heading');
  assert.ok(!/screenshots\.ts|isScreenshotSlug/.test(shot), 'no slug registry');
  const hero = readFileSync(new URL('../src/components/Hero.astro', import.meta.url), 'utf8');
  assert.match(hero, /scheme=\{isHome \? 'band' : 'page'\}/, 'Hero.astro asks for the band policy on the home page only');
  const feature = readFileSync(new URL('../src/components/Feature.astro', import.meta.url), 'utf8');
  assert.doesNotMatch(feature, /scheme=/, 'Feature.astro leaves the default (page) policy');
});

test('the Open Graph image is the generated 1200x630 PNG whose hash docs/content.md records', () => {
  const png = readFileSync(new URL('../public/og-image.png', import.meta.url));
  assert.equal(png.toString('latin1', 1, 4), 'PNG');
  assert.equal(png.readUInt32BE(16), 1200, 'width');
  assert.equal(png.readUInt32BE(20), 630, 'height');
  const doc = readFileSync(new URL('../docs/content.md', import.meta.url), 'utf8');
  const recorded = doc.match(/committed `public\/og-image\.png`[\s\S]*?SHA-256 is\s*`([0-9a-f]{64})`/)?.[1];
  assert.ok(recorded, 'docs/content.md records the hash of public/og-image.png');
  assert.equal(createHash('sha256').update(png).digest('hex'), recorded, 'public/og-image.png matches the hash in docs/content.md: regenerate with node scripts/og-image.mjs and update the doc together');
  const layout = readFileSync(new URL('../src/layouts/Site.astro', import.meta.url), 'utf8');
  assert.match(layout, /og:image:width" content="1200"/);
  assert.match(layout, /og:image:height" content="630"/);
  const alt = layout.match(/ogImageAlt = '([^']*)'/)?.[1] ?? '';
  assert.ok(alt.includes(home.data.layout[0].heading), 'the image alt carries the hero line from the seed');
  assert.ok(/made-up/.test(alt) && !/HK7N/.test(layout), 'the image alt says the data is made up and carries no fixture code');
});
