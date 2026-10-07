#!/usr/bin/env node
/**
 * Mirror the live CMS into the repository (decision cms-first-013).
 *
 *   node scripts/cms-mirror.mjs            # write seed/seed.json and seed/media.json from the live CMS, push a
 *                                          # cms-edit/<timestamp> branch from origin/main and open the PR "CMS edit: ..." (label cms-edit)
 *   node scripts/cms-mirror.mjs --check    # report where the repository differs from the live CMS; exit 1 if it does
 *   node scripts/cms-mirror.mjs --no-pr    # only rewrite seed/seed.json and seed/media.json in this checkout
 *
 * The CMS owns content: this is the manual and on-touch safety net for the
 * mirror the site runs itself after every publish or unpublish
 * (src/cms/mirror.ts). It rewrites only `content.pages` of the seed (every
 * image field as the `$media` reference a fresh site sideloads) and the
 * `library` and `usage` sections of the media manifest (media-library-014);
 * block types, collections, the approved captures and everything else stay
 * as the repository says, and a CMS schema that differs from the repository
 * is reported (npm run cms:sync fixes it). It never writes to the CMS.
 *
 * Options: --url <base> (default EMDASH_URL or https://repoglance.com),
 * --seed <path> (default seed/seed.json), --manifest <path> (default
 * seed/media.json), --header "Name: Value" (repeatable), --json, --help.
 * Identity: see scripts/lib/cms-client.mjs.
 */
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { canonicalFields, manifestDifferences, mirrorManifest, mirrorPages, pageDifferences, serializeManifest, serializeSeed } from '../src/content/cms-shape.ts';
import { BRANCH_PREFIX, LABEL, MEDIA_MANIFEST_PATH, SEED_PATH, describeChange, emptyManifest } from '../src/cms/mirror.ts';
import { IDENTITY_HELP, createClient, describeApiError, livePages, readBlockTypes, readEntries, readLibrary, resolveIdentity } from './lib/cms-client.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const execFileAsync = promisify(execFile);
const COLLECTION = 'pages';

const { values: args } = parseArgs({
  options: {
    check: { type: 'boolean', default: false },
    'no-pr': { type: 'boolean', default: false },
    url: { type: 'string' },
    seed: { type: 'string', default: SEED_PATH },
    manifest: { type: 'string', default: MEDIA_MANIFEST_PATH },
    header: { type: 'string', multiple: true, default: [] },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
  strict: true,
});

if (args.help) {
  console.log(readFileSync_(fileURLToPath(import.meta.url)).split('*/')[0].replace(/^\/\*\*\n/, '').replace(/^ \* ?/gm, ''));
  console.log(IDENTITY_HELP);
  process.exit(0);
}
function readFileSync_(path) {
  // eslint-disable-next-line n/no-sync -- the help text only
  return require_fs().readFileSync(path, 'utf8');
}
function require_fs() {
  return process.getBuiltinModule('node:fs');
}

const mode = args.check ? 'check' : args['no-pr'] ? 'write' : 'pr';
const base = (args.url ?? process.env.EMDASH_URL ?? 'https://repoglance.com').replace(/\/+$/, '');
const seedPath = resolve(root, args.seed);
const manifestPath = resolve(root, args.manifest);

async function readManifest(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error && error.code === 'ENOENT') return emptyManifest();
    throw error;
  }
}

function fail(code, message) {
  console.error(`cms-mirror: ${message}`);
  process.exit(code);
}

function say(line) {
  if (!args.json) console.log(line);
}

async function git(cwd, ...command) {
  const { stdout } = await execFileAsync('git', command, { cwd });
  return stdout.trim();
}

async function gh(cwd, ...command) {
  const { stdout } = await execFileAsync('gh', command, { cwd });
  return stdout.trim();
}

/** Block types whose active fields or metadata differ from the repository's declaration. */
function schemaDrift(seed, cmsTypes) {
  const drift = [];
  for (const type of seed.blockTypes ?? []) {
    const cms = cmsTypes.get(type.slug);
    if (!cms) {
      drift.push(`${type.slug}: missing in the CMS`);
      continue;
    }
    const active = cms.versions?.find((version) => version.active) ?? cms.versions?.find((version) => version.version === cms.currentVersion);
    const wanted = type.versions.find((version) => version.version === type.currentVersion);
    if (!active || JSON.stringify(canonicalFields(wanted.fields)) !== JSON.stringify(canonicalFields(active.fields))) drift.push(`${type.slug}: the active version's fields differ`);
    else if ((type.label ?? null) !== (cms.label ?? null)) drift.push(`${type.slug}: label differs`);
  }
  for (const slug of cmsTypes.keys()) if (!(seed.blockTypes ?? []).some((type) => type.slug === slug)) drift.push(`${slug}: in the CMS, not declared by the repository`);
  return drift;
}

let identity;
try {
  identity = await resolveIdentity(base, args.header);
} catch (error) {
  fail(2, error.message);
}
const client = createClient(base, identity);
say(`cms-mirror (${mode}): the live CMS at ${base} into ${args.seed} and ${args.manifest}\n  identity: ${identity.label}`);

let seed;
let manifest;
let live;
let library;
let differences;
let mediaDifferences;
let drift;
try {
  seed = JSON.parse(await readFile(seedPath, 'utf8'));
  manifest = await readManifest(manifestPath);
  const entries = await readEntries(client, COLLECTION);
  live = livePages(entries);
  library = await readLibrary(client);
  const mediaById = new Map(library.map((item) => [item.id, item]));
  differences = pageDifferences(seed, live, COLLECTION, { mediaById, base: manifest.base });
  mediaDifferences = manifestDifferences(manifest, mirrorManifest(manifest, library, live, seed, COLLECTION));
  drift = schemaDrift(seed, await readBlockTypes(client));
  const drafts = entries.filter((entry) => entry.draft).map((entry) => entry.slug);
  say(`  live pages: ${live.map((page) => page.slug).join(', ') || 'none'}${drafts.length ? ` (pending drafts, not mirrored: ${drafts.join(', ')})` : ''}`);
  for (const difference of differences) say(`  page ${difference.slug}: ${difference.kind === 'content' ? `content differs (${difference.detail})` : difference.detail}`);
  if (!differences.length) say('  pages: the repository equals the live CMS');
  say(`  media library: ${library.length} ready item${library.length === 1 ? '' : 's'}`);
  for (const line of mediaDifferences) say(`  media: ${line}`);
  if (!mediaDifferences.length) say('  media: the manifest equals the live library');
  for (const line of drift) say(`  schema: ${line} (structure is the repository's: npm run cms:sync)`);
} catch (error) {
  fail(1, describeApiError(error));
}

const behind = differences.length > 0 || mediaDifferences.length > 0;
let result = { mode, url: base, identity: identity.label, differences, mediaDifferences, schemaDrift: drift, equal: !behind && drift.length === 0 };

if (mode === 'check') {
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else console.log(result.equal ? 'Result: the repository equals the live CMS.' : `Result: the repository is BEHIND the live CMS${drift.length ? ' or its schema' : ''}. Run npm run cms:mirror${drift.length ? ' and npm run cms:sync' : ''}.`);
  process.exit(result.equal ? 0 : 1);
}

if (!behind) {
  if (args.json) console.log(JSON.stringify({ ...result, action: 'none' }, null, 2));
  else console.log('Result: nothing to mirror; the repository already equals the live CMS.');
  process.exit(0);
}

/** The two files the mirror writes, built on `baseSeed` and `baseManifest`; only the ones that differ. */
function mirrorFiles(baseSeed, baseSeedText, baseManifest, baseManifestText) {
  const mediaById = new Map(library.map((item) => [item.id, item]));
  const seedText = serializeSeed(mirrorPages(baseSeed, live, COLLECTION, { mediaById, base: baseManifest.base }));
  const after = mirrorManifest(baseManifest, library, live, baseSeed, COLLECTION);
  const manifestText = serializeManifest(after);
  return {
    files: [...(seedText === baseSeedText ? [] : [[SEED_PATH, seedText]]), ...(manifestText === baseManifestText ? [] : [[MEDIA_MANIFEST_PATH, manifestText]])],
    media: { library, before: baseManifest, after },
  };
}

if (mode === 'write') {
  const written = [];
  const { files } = mirrorFiles(seed, await readFile(seedPath, 'utf8'), manifest, await readFile(manifestPath, 'utf8').catch(() => null));
  for (const [path, text] of files) {
    await writeFile(path === SEED_PATH ? seedPath : manifestPath, text);
    written.push(path === SEED_PATH ? args.seed : args.manifest);
  }
  if (args.json) console.log(JSON.stringify({ ...result, action: 'written', paths: written }, null, 2));
  else console.log(`Result: ${written.join(' and ')} rewritten from the live CMS (${[...differences.map((difference) => difference.slug), ...(mediaDifferences.length ? ['media'] : [])].join(', ')}). Review it with git diff; nothing was pushed.`);
  process.exit(0);
}

// PR mode: a throwaway worktree on origin/main so this checkout is untouched.
const at = new Date();
const branch = `${BRANCH_PREFIX}${at.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/[:]/g, '').replace('T', '-').replace('Z', 'z')}`;
const worktree = await mkdtemp(join(tmpdir(), 'repoglance-cms-mirror-'));
let prUrl;
let failure;
try {
  await git(root, 'fetch', 'origin', 'main');
  await git(root, 'worktree', 'add', '--detach', worktree, 'origin/main');
  const mainSeedText = await readFile(join(worktree, SEED_PATH), 'utf8');
  const mainSeed = JSON.parse(mainSeedText);
  const mainManifestText = await readFile(join(worktree, MEDIA_MANIFEST_PATH), 'utf8').catch(() => null);
  const mainManifest = mainManifestText === null ? emptyManifest() : JSON.parse(mainManifestText);
  const { files, media } = mirrorFiles(mainSeed, mainSeedText, mainManifest, mainManifestText);
  if (!files.length) {
    say('Result: origin/main already equals the live CMS (this checkout is behind main; pull it).');
    process.exitCode = 0;
  } else {
    for (const [path, text] of files) await writeFile(join(worktree, path), text);
    const change = describeChange(mainSeed, live, { collection: COLLECTION, id: differences.map((difference) => difference.slug).join(', ') || 'media', action: 'manual' }, at, media);
    await git(worktree, 'checkout', '-q', '-b', branch);
    await git(worktree, 'add', ...files.map(([path]) => path));
    await git(worktree, '-c', 'user.name=CMS mirror', '-c', 'user.email=mirror@repoglance.com', 'commit', '-q', '-m', change.message);
    await git(worktree, 'push', '-q', '-u', 'origin', branch);
    await gh(worktree, 'label', 'create', LABEL, '--force', '--color', '0E8A16', '--description', 'An edit published in the EmDash admin, mirrored into seed/seed.json');
    prUrl = await gh(worktree, 'pr', 'create', '--base', 'main', '--head', branch, '--label', LABEL, '--title', change.title, '--body', change.body);
    say(`Result: ${prUrl} opened from ${branch}; auto-merge is armed by the cms-edit workflow when the checks are green.`);
  }
} catch (error) {
  failure = `could not open the mirror PR: ${error instanceof Error ? error.message : String(error)}\nThe live CMS is unchanged; retry, or run with --no-pr and open the PR yourself.`;
} finally {
  // Always drop the throwaway worktree, also when the push or gh failed.
  try {
    await git(root, 'worktree', 'remove', '--force', worktree);
  } catch {
    await rm(worktree, { recursive: true, force: true });
    try {
      await git(root, 'worktree', 'prune');
    } catch {
      // nothing more to clean
    }
  }
}
if (failure) fail(1, failure);
if (args.json) console.log(JSON.stringify({ ...result, action: prUrl ? 'pr' : 'none', prUrl: prUrl ?? null, branch: prUrl ? branch : null }, null, 2));
