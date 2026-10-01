import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

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

function screenshotOptions(typeSlug) {
  return seed.blockTypes.find((type) => type.slug === typeSlug).versions[0].fields.find((field) => field.slug === 'screenshot').validation.options;
}

test('every screenshot reference is a shipped showcase capture with alt text and dimensions', () => {
  const options = screenshotOptions('hero');
  assert.deepEqual(screenshotOptions('feature'), options, 'hero and feature offer the same screenshots');
  for (const page of pages) {
    for (const block of page.data.layout) {
      if (!('screenshot' in block)) continue;
      assert.ok(options.includes(block.screenshot), `${block._key}: ${block.screenshot} is an option`);
      if (block.screenshot === 'none') continue;
      for (const width of [540, 1080]) {
        const file = new URL(`../public/screenshots/${block.screenshot}-${width}.webp`, import.meta.url);
        assert.ok(existsSync(file), `${block.screenshot}-${width}.webp exists`);
      }
    }
  }
  const source = readFileSync(new URL('../src/content/screenshots.ts', import.meta.url), 'utf8');
  for (const option of options.filter((option) => option !== 'none')) {
    assert.ok(source.includes(`'${option}'`), `${option} has alt text`);
    const start = source.indexOf(`'${option}': {`);
    const entry = source.slice(start, source.indexOf('},', start));
    assert.match(entry, /width: \d+,\s*height: \d+,\s*alt: '[^']*(made.up|fixture|Sign in with GitHub)[^']*'/i, `${option} has dimensions and an alt text that says the data is made up (or shows the sign-in screen)`);
  }
  for (const text of allText) {
    assert.ok(!/HK7N/.test(text), 'the fixture code stays out of the copy');
  }
});
