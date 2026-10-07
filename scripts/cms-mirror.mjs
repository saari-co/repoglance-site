#!/usr/bin/env node
/**
 * Mirror the live CMS into the repository (decision cms-first-013).
 *
 *   node scripts/cms-mirror.mjs            # write seed/seed.json from the live CMS, push a cms-edit/<timestamp>
 *                                          # branch from origin/main and open the PR "CMS edit: ..." (label cms-edit)
 *   node scripts/cms-mirror.mjs --check    # report where the repository differs from the live CMS; exit 1 if it does
 *   node scripts/cms-mirror.mjs --no-pr    # only rewrite seed/seed.json in this checkout
 *
 * The CMS owns content: this is the manual and on-touch safety net for the
 * mirror the site runs itself after every publish or unpublish
 * (src/cms/mirror.ts). It rewrites only `content.pages`; block types,
 * collections and everything else stay as the repository says, and a CMS
 * schema that differs from the repository is reported (npm run cms:sync
 * fixes it). It never writes to the CMS.
 *
 * Options: --url <base> (default EMDASH_URL or https://repoglance.com),
 * --seed <path> (default seed/seed.json), --header "Name: Value"
 * (repeatable), --json, --help. Identity: see scripts/lib/cms-client.mjs.
 */
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { canonicalFields, mirrorPages, pageDifferences, serializeSeed } from '../src/content/cms-shape.ts';
import { BRANCH_PREFIX, LABEL, SEED_PATH, describeChange } from '../src/cms/mirror.ts';
import { IDENTITY_HELP, createClient, describeApiError, livePages, readBlockTypes, readEntries, resolveIdentity } from './lib/cms-client.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const execFileAsync = promisify(execFile);
const COLLECTION = 'pages';

const { values: args } = parseArgs({
  options: {
    check: { type: 'boolean', default: false },
    'no-pr': { type: 'boolean', default: false },
    url: { type: 'string' },
    seed: { type: 'string', default: SEED_PATH },
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
say(`cms-mirror (${mode}): the live CMS at ${base} into ${args.seed}\n  identity: ${identity.label}`);

let seed;
let live;
let differences;
let drift;
try {
  seed = JSON.parse(await readFile(seedPath, 'utf8'));
  const entries = await readEntries(client, COLLECTION);
  live = livePages(entries);
  differences = pageDifferences(seed, live, COLLECTION);
  drift = schemaDrift(seed, await readBlockTypes(client));
  const drafts = entries.filter((entry) => entry.draft).map((entry) => entry.slug);
  say(`  live pages: ${live.map((page) => page.slug).join(', ') || 'none'}${drafts.length ? ` (pending drafts, not mirrored: ${drafts.join(', ')})` : ''}`);
  for (const difference of differences) say(`  page ${difference.slug}: ${difference.kind === 'content' ? `content differs (${difference.detail})` : difference.detail}`);
  if (!differences.length) say('  pages: the repository equals the live CMS');
  for (const line of drift) say(`  schema: ${line} (structure is the repository's: npm run cms:sync)`);
} catch (error) {
  fail(1, describeApiError(error));
}

let result = { mode, url: base, identity: identity.label, differences, schemaDrift: drift, equal: differences.length === 0 && drift.length === 0 };

if (mode === 'check') {
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else console.log(result.equal ? 'Result: the repository equals the live CMS.' : `Result: the repository is BEHIND the live CMS${drift.length ? ' or its schema' : ''}. Run npm run cms:mirror${drift.length ? ' and npm run cms:sync' : ''}.`);
  process.exit(result.equal ? 0 : 1);
}

if (!differences.length) {
  if (args.json) console.log(JSON.stringify({ ...result, action: 'none' }, null, 2));
  else console.log('Result: nothing to mirror; the repository already equals the live CMS.');
  process.exit(0);
}

if (mode === 'write') {
  const text = serializeSeed(mirrorPages(seed, live, COLLECTION));
  await writeFile(seedPath, text);
  if (args.json) console.log(JSON.stringify({ ...result, action: 'written', path: seedPath }, null, 2));
  else console.log(`Result: ${args.seed} rewritten from the live CMS (${differences.map((difference) => difference.slug).join(', ')}). Review it with git diff; nothing was pushed.`);
  process.exit(0);
}

// PR mode: a throwaway worktree on origin/main so this checkout is untouched.
const at = new Date();
const branch = `${BRANCH_PREFIX}${at.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/[:]/g, '').replace('T', '-').replace('Z', 'z')}`;
const worktree = await mkdtemp(join(tmpdir(), 'repoglance-cms-mirror-'));
let prUrl;
try {
  await git(root, 'fetch', 'origin', 'main');
  await git(root, 'worktree', 'add', '--detach', worktree, 'origin/main');
  const mainSeed = JSON.parse(await readFile(join(worktree, SEED_PATH), 'utf8'));
  const mirrored = serializeSeed(mirrorPages(mainSeed, live, COLLECTION));
  if (mirrored === (await readFile(join(worktree, SEED_PATH), 'utf8'))) {
    say('Result: origin/main already equals the live CMS (this checkout is behind main; pull it).');
    process.exitCode = 0;
  } else {
    await writeFile(join(worktree, SEED_PATH), mirrored);
    const change = describeChange(mainSeed, live, { collection: COLLECTION, id: differences.map((difference) => difference.slug).join(', '), action: 'manual' }, at);
    await git(worktree, 'checkout', '-q', '-b', branch);
    await git(worktree, 'add', SEED_PATH);
    await git(worktree, '-c', 'user.name=CMS mirror', '-c', 'user.email=mirror@repoglance.com', 'commit', '-q', '-m', change.message);
    await git(worktree, 'push', '-q', '-u', 'origin', branch);
    await gh(worktree, 'label', 'create', LABEL, '--force', '--color', '0E8A16', '--description', 'An edit published in the EmDash admin, mirrored into seed/seed.json');
    prUrl = await gh(worktree, 'pr', 'create', '--base', 'main', '--head', branch, '--label', LABEL, '--title', change.title, '--body', change.body);
    say(`Result: ${prUrl} opened from ${branch}; auto-merge is armed by the cms-edit workflow when the checks are green.`);
  }
} catch (error) {
  fail(1, `could not open the mirror PR: ${error instanceof Error ? error.message : String(error)}\nThe live CMS is unchanged; retry, or run with --no-pr and open the PR yourself.`);
} finally {
  try {
    await git(root, 'worktree', 'remove', '--force', worktree);
  } catch {
    await rm(worktree, { recursive: true, force: true });
  }
}
if (args.json) console.log(JSON.stringify({ ...result, action: prUrl ? 'pr' : 'none', prUrl: prUrl ?? null, branch: prUrl ? branch : null }, null, 2));
