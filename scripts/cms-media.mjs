#!/usr/bin/env node
/**
 * Keep the Media Library equal to the approved captures (decision media-library-014).
 *
 *   node scripts/cms-media.mjs            # --check: compare the library and the pages with seed/media.json's approved captures; exit 1 when something is missing
 *   node scripts/cms-media.mjs --apply    # upload the missing captures with their alt text, connect the pages, re-check
 *
 * Like WooCommerce's product importer, the import sideloads files into the
 * platform's library and records the source: every approved capture
 * (public/screenshots/, recorded with its hashes in seed/media.json) is
 * matched in the library by EmDash's content hash, uploaded once when
 * missing (deduplicated by that hash, so a second run uploads nothing), and
 * given its alt text and dimensions. A present item's own alt text is never
 * overwritten; alt text lives on the media item (the mirror audits it).
 *
 * --check reports, per approved capture, present or missing, an empty or
 * different alt, wrong dimensions; per hero or feature block, a legacy
 * `screenshot` slug awaiting its reference (the breaking block-type change
 * of this decision), an image that is not an approved capture, a reference
 * to an item the library no longer has, and a missing or wrong dark
 * pairing. --apply uploads what is missing, writes the alt of an item that
 * has none, and connects the blocks from the library: a legacy slug becomes
 * the capture's light cut with its dark cut as the dark variant (the dark
 * cut alone when no light cut exists), and an approved primary without its
 * dark cut gets it. It writes the page against the revision it read and
 * publishes it as you; a page with a pending draft is left alone and
 * reported. It never deletes anything and never writes copy from the seed.
 *
 * Options: --url <base> (default EMDASH_URL or https://repoglance.com),
 * --seed <path> (default seed/seed.json), --manifest <path> (default
 * seed/media.json), --header "Name: Value" (repeatable), --json, --help.
 * Identity: see scripts/lib/cms-client.mjs.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { canon, imageFieldsOf, mediaReference } from '../src/content/cms-shape.ts';
import { captureName } from '../src/content/media.ts';
import { IDENTITY_HELP, createClient, describeApiError, readBlockTypes, readEntries, readLibrary, resolveIdentity } from './lib/cms-client.mjs';
import { webpFacts } from './lib/webp.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const { values: args } = parseArgs({
  options: {
    check: { type: 'boolean', default: false },
    apply: { type: 'boolean', default: false },
    url: { type: 'string' },
    seed: { type: 'string', default: 'seed/seed.json' },
    manifest: { type: 'string', default: 'seed/media.json' },
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
const manifest = JSON.parse(readFileSync(resolve(root, args.manifest), 'utf8'));
const COLLECTION = 'pages';
const capturesDir = join(root, 'public/screenshots');

function fail(code, message) {
  console.error(`cms-media: ${message}`);
  process.exit(code);
}

const say = (line) => {
  if (!args.json) console.log(line);
};

/** The approved captures, each checked against the file it names before anything is uploaded. */
function approvedCaptures() {
  return (manifest.approved ?? []).map((capture) => {
    const bytes = readFileSync(join(capturesDir, capture.file));
    const facts = webpFacts(bytes);
    if (facts.contentHash !== capture.contentHash || facts.sha256 !== capture.sha256) fail(1, `${capture.file} does not match its record in ${args.manifest}: run node scripts/approved-captures.mjs --write and review the diff`);
    if (!capture.alt) fail(1, `${capture.file} has no alt text in ${args.manifest}`);
    return { ...capture, bytes };
  });
}

/** Compare the library with the approved captures. */
function compareLibrary(approved, library) {
  const byHash = new Map();
  for (const item of library) if (item.contentHash && !byHash.has(item.contentHash)) byHash.set(item.contentHash, item);
  const rows = approved.map((capture) => {
    const item = byHash.get(capture.contentHash) ?? null;
    const notes = [];
    if (item) {
      if (!item.alt) notes.push('alt empty');
      else if (item.alt !== capture.alt) notes.push('alt differs from the repository text (the library wins)');
      if (item.width !== capture.width || item.height !== capture.height) notes.push(`dimensions ${item.width}x${item.height}, expected ${capture.width}x${capture.height}`);
      if (item.filename !== capture.file) notes.push(`file name ${item.filename}`);
    }
    return { file: capture.file, capture: capture.capture, scheme: capture.scheme, present: Boolean(item), id: item?.id ?? null, notes };
  });
  const approvedHashes = new Set(approved.map((capture) => capture.contentHash));
  const extras = library.filter((item) => !item.contentHash || !approvedHashes.has(item.contentHash)).map((item) => ({ id: item.id, filename: item.filename, alt: item.alt }));
  return { rows, extras, byHash };
}

/** The media value a block stores for a library item (EmDash fills the rest on write). */
function mediaValue(item) {
  return { id: item.id, provider: 'local', alt: item.alt ?? '', width: item.width ?? undefined, height: item.height ?? undefined, meta: { storageKey: item.storageKey } };
}

/**
 * The library items of a capture by scheme, approved cuts only (matched by
 * content hash, so an editor's re-upload of the same bytes counts).
 */
function cutsOf(capture, approved, byHash) {
  const cuts = {};
  for (const entry of approved) if (entry.capture === capture) cuts[entry.scheme] = byHash.get(entry.contentHash) ?? null;
  return cuts;
}

/**
 * What each image slot of the live pages shows and what, if anything, to
 * change. Returns rows for the report and the planned block rewrites.
 */
function comparePages(entries, approved, byHash, library, blockTypes) {
  const imageFields = imageFieldsOf(seed);
  const mediaById = new Map(library.map((item) => [item.id, item]));
  const approvedByHash = new Map(approved.map((capture) => [capture.contentHash, capture]));
  const currentVersion = (type) => blockTypes.get(type)?.currentVersion ?? 1;
  const rows = [];
  const plans = [];
  for (const entry of entries) {
    const data = entry.live ?? entry.item.data;
    if (!data) continue;
    const layout = Array.isArray(data.layout) ? data.layout : [];
    let changed = false;
    const nextLayout = layout.map((block) => {
      const fields = imageFields.get(block._type) ?? [];
      if (!fields.length) return block;
      let next = block;
      for (const field of fields) {
        const value = block[field];
        const legacy = typeof block.screenshot === 'string' ? block.screenshot : null;
        const row = { page: entry.slug, block: block._key ?? '', type: block._type, field, state: 'ok', detail: '' };
        const connect = (capture, reason) => {
          const cuts = cutsOf(capture, approved, byHash);
          const primary = cuts.light ?? cuts.dark;
          if (!primary) {
            row.state = 'missing';
            row.detail = `${reason}; the capture ${capture} is not in the library (upload first)`;
            return;
          }
          const image = cuts.light && cuts.dark ? { ...mediaValue(cuts.light), darkVariant: mediaValue(cuts.dark) } : mediaValue(primary);
          row.state = 'connect';
          row.detail = `${reason}: ${primary.filename}${cuts.light && cuts.dark ? ` with dark variant ${cuts.dark.filename}` : ''}`;
          const { screenshot: _legacy, ...rest } = next;
          next = { ...rest, _version: currentVersion(block._type), [field]: image };
          changed = true;
        };
        if (!value || typeof value !== 'object') {
          if (legacy && legacy !== 'none') connect(legacy, `legacy slug ${legacy}`);
          else {
            row.state = 'none';
            row.detail = 'no image; the block renders no figure';
          }
          rows.push(row);
          continue;
        }
        const reference = mediaReference(value, mediaById);
        const item = reference?.id ? mediaById.get(reference.id) : undefined;
        if (!item) {
          row.state = 'gone';
          row.detail = `references ${reference?.filename ?? reference?.id ?? 'an unreadable value'}, which the library does not have`;
          rows.push(row);
          continue;
        }
        const capture = item.contentHash ? approvedByHash.get(item.contentHash) : undefined;
        if (!capture) {
          row.state = 'unapproved';
          row.detail = `${item.filename} is not an approved capture`;
          rows.push(row);
          continue;
        }
        const cuts = cutsOf(capture.capture, approved, byHash);
        const darkReference = mediaReference(value.darkVariant, mediaById);
        const dark = darkReference?.id ? mediaById.get(darkReference.id) : undefined;
        const wantsPair = Boolean(cuts.light && cuts.dark);
        if (wantsPair && (capture.scheme !== 'light' || !dark || dark.id !== cuts.dark.id)) {
          if (dark && dark.id !== cuts.dark.id && dark.id !== cuts.light.id) {
            row.state = 'pairing';
            row.detail = `${item.filename} paired with ${dark.filename}, expected ${cuts.dark.filename}`;
          } else {
            connect(capture.capture, capture.scheme !== 'light' ? `${item.filename} is the dark cut` : `${item.filename} without its dark cut`);
          }
        } else if (!wantsPair && dark) {
          row.state = 'pairing';
          row.detail = `${item.filename} has no light cut but is paired with ${dark.filename}`;
        } else {
          row.detail = `${item.filename}${dark ? ` with dark variant ${dark.filename}` : ''}`;
        }
        rows.push(row);
      }
      return next;
    });
    if (changed) plans.push({ entry, data: { ...data, layout: nextLayout } });
  }
  return { rows, plans };
}

async function upload(client, capture) {
  const form = new FormData();
  form.append('file', new Blob([capture.bytes], { type: 'image/webp' }), capture.file);
  form.append('alt', capture.alt);
  form.append('width', String(capture.width));
  form.append('height', String(capture.height));
  form.append('deduplicate', 'true');
  const response = await client.send('POST', '/media', { body: form });
  await client.assertOk(response);
  const { data } = await response.json();
  return data;
}

let identity;
try {
  identity = await resolveIdentity(base, args.header);
} catch (error) {
  fail(2, error.message);
}
const client = createClient(base, identity);
say(`cms-media (${mode}): the Media Library at ${base} against the ${manifest.approved?.length ?? 0} approved captures of ${args.manifest}\n  identity: ${identity.label}`);

const applied = [];
const log = (line) => {
  applied.push(line);
  if (!args.json) console.log(`  ${line}`);
};

function print(report, pages, label) {
  console.log(label);
  for (const row of report.rows) console.log(`  ${row.file}: ${row.present ? `present (${row.id})` : 'MISSING'}${row.notes.length ? `; ${row.notes.join('; ')}` : ''}`);
  if (report.extras.length) console.log(`  not approved captures (unused ones are only listed): ${report.extras.map((item) => `${item.filename} (${item.id})`).join(', ')}`);
  for (const row of pages.rows) console.log(`  ${row.page}/${row.block}.${row.field}: ${row.state === 'ok' ? row.detail : `${row.state.toUpperCase()} ${row.detail}`}`);
}

function settled(report, pages) {
  return report.rows.every((row) => row.present && !row.notes.some((note) => note === 'alt empty')) && pages.rows.every((row) => row.state === 'ok');
}

let before;
let beforePages;
let after;
let afterPages;
try {
  const approved = approvedCaptures();
  const readState = async () => {
    const library = await readLibrary(client);
    const report = compareLibrary(approved, library);
    const entries = await readEntries(client, COLLECTION);
    const pages = comparePages(entries, approved, report.byHash, library, await readBlockTypes(client));
    return { library, report, entries, pages };
  };
  let state = await readState();
  before = state.report;
  beforePages = state.pages;
  if (!args.json) print(before, beforePages, 'Before:');
  if (mode === 'apply' && !settled(before, beforePages)) {
    if (!args.json) console.log('Applying:');
    for (const row of before.rows) {
      const capture = approved.find((entry) => entry.file === row.file);
      if (!row.present) {
        const result = await upload(client, capture);
        log(`${capture.file}: ${result.deduplicated ? 'already in the library (same bytes)' : 'uploaded'} as ${result.item.id}`);
      } else if (row.notes.includes('alt empty')) {
        await client.request('PUT', `/media/${encodeURIComponent(row.id)}`, { alt: capture.alt });
        log(`${capture.file}: alt text written`);
      }
    }
    // The pages are connected from the library as it is after the uploads.
    state = await readState();
    for (const plan of state.pages.plans) {
      const { entry } = plan;
      if (entry.draft) {
        log(`page ${entry.slug}: left alone, it has a pending draft; connect it in the admin`);
        continue;
      }
      const written = await client.request('PUT', `/content/${COLLECTION}/${encodeURIComponent(entry.item.id)}`, { data: plan.data, _rev: entry.item._rev, migrateBlocks: true });
      if (entry.status === 'published') {
        await client.request('POST', `/content/${COLLECTION}/${encodeURIComponent(entry.item.id)}/publish`, { _rev: written._rev });
        log(`page ${entry.slug}: connected and published`);
      } else {
        log(`page ${entry.slug}: connected (the page is ${entry.status}; not published)`);
      }
    }
    state = await readState();
    after = state.report;
    afterPages = state.pages;
    if (!args.json) print(after, afterPages, 'After:');
  }
} catch (error) {
  fail(1, describeApiError(error));
}

const finalReport = after ?? before;
const finalPages = afterPages ?? beforePages;
const ok = settled(finalReport, finalPages);
if (args.json) {
  console.log(JSON.stringify(canon({ at: new Date().toISOString(), mode, url: base, identity: identity.label, before: { library: before.rows, extras: before.extras, pages: beforePages.rows }, applied, after: after ? { library: after.rows, extras: after.extras, pages: afterPages.rows } : null, ok }), null, 2));
} else if (ok) {
  console.log(mode === 'apply' && after ? 'Result: the library now holds every approved capture and every page slot is connected.' : 'Result: the library holds every approved capture and every page slot is connected.');
} else {
  console.log(mode === 'apply' ? 'Result: something is still MISSING or unconnected after applying; see above.' : 'Result: MISSING captures or unconnected slots. Run with --apply (after the Worker that renders them is deployed and npm run cms:sync has carried the block types).');
}
process.exit(ok ? 0 : 1);
