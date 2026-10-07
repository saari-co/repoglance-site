#!/usr/bin/env node
/**
 * Keep the CMS's structure equal to the repository's (decision cms-first-013).
 *
 *   node scripts/cms-sync.mjs            # --check: report block types that differ from seed/seed.json, exit 1 on drift
 *   node scripts/cms-sync.mjs --apply    # write the seed's block types into the CMS, then re-check
 *
 * The repository owns structure and the CMS owns content: this script
 * creates and updates block types (a compatible change updates the active
 * version in place; a breaking one, such as a removed select option,
 * creates or reuses a version and activates it) and never writes page
 * content. A brand-new site gets its pages once, from EmDash setup; after
 * that pages flow from the CMS into the repository (npm run cms:mirror).
 *
 * Options: --url <base> (default EMDASH_URL or https://repoglance.com),
 * --seed <path> (default seed/seed.json), --header "Name: Value"
 * (repeatable), --json, --help. Identity: see scripts/lib/cms-client.mjs.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { canonicalFields, diffPaths, same } from '../src/content/cms-shape.ts';
import { EmDashApiError, IDENTITY_HELP, createClient, describeApiError, readBlockTypes, readEntries, resolveIdentity } from './lib/cms-client.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const { values: args } = parseArgs({
  options: {
    check: { type: 'boolean', default: false },
    apply: { type: 'boolean', default: false },
    url: { type: 'string' },
    seed: { type: 'string', default: 'seed/seed.json' },
    header: { type: 'string', multiple: true, default: [] },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
  strict: true,
});

if (args.help) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace(/^\/\*\*\n/, '').replace(/^ \* ?/gm, ''));
  console.log(IDENTITY_HELP);
  process.exit(0);
}
if (args.check && args.apply) fail(2, 'choose --check or --apply, not both');
const mode = args.apply ? 'apply' : 'check';
const base = (args.url ?? process.env.EMDASH_URL ?? 'https://repoglance.com').replace(/\/+$/, '');
const seed = JSON.parse(readFileSync(resolve(root, args.seed), 'utf8'));
const COLLECTION = 'pages';

function fail(code, message) {
  console.error(`cms-sync: ${message}`);
  process.exit(code);
}

const meta = (value) => (typeof value === 'string' && value.trim() ? value : null);

function activeVersion(blockType) {
  return blockType.versions?.find((version) => version.active) ?? blockType.versions?.find((version) => version.version === blockType.currentVersion) ?? null;
}

function seedVersion(blockType) {
  return blockType.versions.find((version) => version.version === blockType.currentVersion);
}

function blockTypeReport(seedType, cmsType) {
  if (!cmsType) return { slug: seedType.slug, state: 'missing', differences: ['missing in the CMS'] };
  const active = activeVersion(cmsType);
  const differences = [];
  for (const key of ['label', 'category', 'description', 'icon']) {
    if (meta(seedType[key]) !== meta(cmsType[key])) differences.push(`${key}: seed ${JSON.stringify(meta(seedType[key]))}, CMS ${JSON.stringify(meta(cmsType[key]))}`);
  }
  const fieldsDiffer = !active || !same(canonicalFields(seedVersion(seedType).fields), canonicalFields(active.fields));
  if (fieldsDiffer) differences.push(`fields of the active version ${active?.version ?? '?'} differ: ${diffPaths(canonicalFields(active?.fields), canonicalFields(seedVersion(seedType).fields)).join(', ')}`);
  return { slug: seedType.slug, state: differences.length ? 'differs' : 'equal', differences, fieldsDiffer, activeVersion: active?.version ?? null, fingerprint: active?.fingerprint ?? null };
}

function compare(cmsTypes) {
  const blockTypes = (seed.blockTypes ?? []).map((type) => blockTypeReport(type, cmsTypes.get(type.slug) ?? null));
  const seedSlugs = new Set((seed.blockTypes ?? []).map((type) => type.slug));
  const extras = [...cmsTypes.keys()].filter((slug) => !seedSlugs.has(slug));
  return { blockTypes, extras, equal: blockTypes.every((type) => type.state === 'equal') && extras.length === 0 };
}

async function applyBlockTypes(client, report, cmsTypes, log) {
  for (const type of report.blockTypes) {
    if (type.state === 'equal') continue;
    const seedType = seed.blockTypes.find((candidate) => candidate.slug === type.slug);
    const fields = seedVersion(seedType).fields;
    if (type.state === 'missing') {
      await client.request('POST', '/schema/block-types', {
        slug: seedType.slug,
        label: seedType.label,
        ...(meta(seedType.category) ? { category: seedType.category } : {}),
        ...(meta(seedType.description) ? { description: seedType.description } : {}),
        ...(meta(seedType.icon) ? { icon: seedType.icon } : {}),
        fields,
      });
      log(`block type ${type.slug}: created`);
      continue;
    }
    const cmsType = cmsTypes.get(type.slug);
    const body = { expectedFingerprint: type.fingerprint };
    for (const key of ['label', 'category', 'description', 'icon']) if (meta(seedType[key]) !== meta(cmsType[key])) body[key] = meta(seedType[key]);
    if (type.fieldsDiffer) body.fields = fields;
    try {
      await client.request('PUT', `/schema/block-types/${encodeURIComponent(type.slug)}`, body);
      log(`block type ${type.slug}: updated in place (compatible change)`);
    } catch (error) {
      if (!(error instanceof EmDashApiError && error.code === 'BLOCK_TYPE_BREAKING_CHANGE')) throw error;
      // A breaking change needs its own version. EmDash creates one, or
      // reuses an inactive version that already holds exactly these fields,
      // and leaves it inactive until it is activated against the still-active
      // version's fingerprint.
      const knownVersions = new Set(cmsType.versions.map((version) => version.version));
      const updated = (await client.request('PUT', `/schema/block-types/${encodeURIComponent(type.slug)}`, { ...body, breaking: true })).item;
      const target = updated.versions.find((version) => !version.active && same(canonicalFields(version.fields), canonicalFields(fields)));
      if (!target) throw new Error(`block type ${type.slug}: the breaking update left no version with the seed's fields`);
      const stillActive = activeVersion(updated);
      await client.request('POST', `/schema/block-types/${encodeURIComponent(type.slug)}/versions/${target.version}/activate`, { expectedFingerprint: stillActive.fingerprint });
      log(`block type ${type.slug}: breaking change, version ${target.version} ${knownVersions.has(target.version) ? 'reactivated (it already held these fields)' : 'created and activated'} (was ${stillActive.version})`);
    }
  }
}

function print(report, label) {
  console.log(label);
  for (const type of report.blockTypes) console.log(`  block type ${type.slug}: ${type.state}${type.differences.length ? `: ${type.differences.join('; ')}` : ''}`);
  console.log(`  block types only in the CMS: ${report.extras.length ? report.extras.join(', ') : 'none'}`);
}

let identity;
try {
  identity = await resolveIdentity(base, args.header);
} catch (error) {
  fail(2, error.message);
}
const client = createClient(base, identity);
const applied = [];
const log = (line) => {
  applied.push(line);
  if (!args.json) console.log(`  ${line}`);
};

let before;
let after;
let pages;
try {
  if (!args.json) console.log(`cms-sync (${mode}): the structure of ${args.seed} (${seed.blockTypes?.length ?? 0} block types) against ${base}\n  identity: ${identity.label}`);
  const cmsTypes = await readBlockTypes(client);
  before = compare(cmsTypes);
  if (!args.json) print(before, 'Before:');
  const entries = await readEntries(client, COLLECTION);
  pages = entries.map((entry) => `${entry.slug} (${entry.status}${entry.draft ? ', pending draft' : ''})`);
  if (!args.json) console.log(`  pages (CMS-owned, not written here; npm run cms:mirror brings them into the repository): ${pages.join(', ') || 'none'}`);
  if (mode === 'apply' && !before.equal) {
    if (!args.json) console.log('Applying:');
    await applyBlockTypes(client, before, cmsTypes, log);
    after = compare(await readBlockTypes(client));
    if (!args.json) print(after, 'After:');
  }
} catch (error) {
  fail(1, describeApiError(error));
}

const final = after ?? before;
if (args.json) {
  console.log(JSON.stringify({ at: new Date().toISOString(), mode, url: base, identity: identity.label, seed: args.seed, before, applied, after: after ?? null, pages, equal: final.equal }, null, 2));
} else if (final.equal) {
  console.log(mode === 'apply' && after ? "Result: the CMS's structure now equals the repository's." : "Result: the CMS's structure equals the repository's.");
} else {
  console.log(mode === 'apply' ? 'Result: structure DRIFT remains after applying; see the differences above.' : "Result: structure DRIFT. Run with --apply to write the repository's block types into the CMS (after the Worker that renders them is deployed).");
}
process.exit(final.equal ? 0 : 1);
