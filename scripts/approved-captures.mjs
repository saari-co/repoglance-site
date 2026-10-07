#!/usr/bin/env node
/**
 * Record the approved captures in seed/media.json (decision media-library-014).
 *
 *   node scripts/approved-captures.mjs            # --check: compare the record with public/screenshots/, exit 1 on drift
 *   node scripts/approved-captures.mjs --write    # rewrite the `approved` section from the files
 *
 * The repository owns which images may appear on the site: every WebP under
 * public/screenshots/ is a cut of a RepoGlance showcase capture whose source
 * and hash docs/content.md records. This script reads each file's size,
 * dimensions, SHA-256 and EmDash content hash and writes them into the
 * `approved` section of seed/media.json, keeping the alt text already
 * recorded there (a new file starts with an empty alt, which the content
 * tests refuse until it is written). The `library` and `usage` sections are
 * the mirror's (npm run cms:mirror) and are left untouched.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { captureName, captureScheme } from '../src/content/media.ts';
import { webpFacts } from './lib/webp.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { values: args } = parseArgs({ options: { write: { type: 'boolean', default: false }, check: { type: 'boolean', default: false } }, strict: true });
const manifestPath = join(root, 'seed/media.json');
const dir = join(root, 'public/screenshots');

export function approvedFromFiles(existing = []) {
  const alts = new Map(existing.map((capture) => [capture.file, capture.alt ?? '']));
  return readdirSync(dir)
    .filter((name) => name.endsWith('.webp'))
    .sort()
    .map((file) => {
      const bytes = readFileSync(join(dir, file));
      const facts = webpFacts(bytes);
      const scheme = captureScheme(file);
      if (!scheme) throw new Error(`${file}: a capture is named <capture>-light.webp or <capture>-dark.webp`);
      return { file, capture: captureName(file), scheme, width: facts.width, height: facts.height, size: facts.size, sha256: facts.sha256, contentHash: facts.contentHash, alt: alts.get(file) ?? '' };
    });
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const approved = approvedFromFiles(manifest.approved ?? []);
const current = JSON.stringify(manifest.approved ?? []);
const wanted = JSON.stringify(approved);
if (args.write) {
  writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, approved }, null, 2)}\n`);
  console.log(`approved-captures: ${approved.length} captures recorded in seed/media.json${approved.some((capture) => !capture.alt) ? ' (some without alt text: write it before committing)' : ''}.`);
} else if (current === wanted) {
  console.log(`approved-captures: seed/media.json records the ${approved.length} captures under public/screenshots/ as they are.`);
} else {
  console.error('approved-captures: seed/media.json differs from public/screenshots/. Run node scripts/approved-captures.mjs --write and review the diff.');
  process.exit(1);
}
