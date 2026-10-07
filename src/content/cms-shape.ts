/**
 * Pure shaping shared by the Worker-side mirror (src/cms/mirror.ts) and the
 * Node scripts (scripts/cms-mirror.mjs, scripts/cms-sync.mjs,
 * scripts/cms-media.mjs). No Astro, no Node, no network: the unit tests run
 * it directly.
 *
 * Decision cms-first-013: the CMS owns content, the repository owns
 * structure. A mirrored seed keeps everything the repository says (schema,
 * collections, meta, block types) and replaces only `content.pages` with
 * what is live in the CMS. Block `_version` is written as 1, the seed's
 * fresh-install version; the CMS's version numbers follow its own history.
 *
 * Decision media-library-014: an image field is live as a media value
 * (`{ id, alt, width, height, meta: { storageKey }, darkVariant }`) and is
 * written into the seed as the `$media` reference a fresh site sideloads at
 * bootstrap (`{ "$media": { url, alt }, darkVariant: { "$media": {...} } }`),
 * the URL naming the library item's file under the approved captures. The
 * mirror also records the library and which block uses which item in
 * `seed/media.json`, the media manifest the content tests judge.
 */
import { SEED_MEDIA_BASE, captureName, isSeedMediaRef, seedRefFile, storageKeyOf, type LibraryItem, type MediaManifest, type MediaUsage, type MediaValue, type SeedImageValue, type SeedMediaRef } from './media.ts';

export type { LibraryItem, MediaManifest, MediaUsage } from './media.ts';

export interface SeedBlock {
  _type: string;
  _version?: number;
  _key?: string;
  [field: string]: unknown;
}

export interface PageData {
  title?: string;
  description?: string;
  layout?: SeedBlock[];
  [field: string]: unknown;
}

export interface SeedPage {
  id?: string;
  slug: string;
  status?: string;
  data: PageData;
}

export interface SeedFile {
  content?: { pages?: SeedPage[]; [collection: string]: unknown };
  collections?: { slug: string; fields: { slug: string; type: string }[] }[];
  blockTypes?: SeedBlockType[];
  [key: string]: unknown;
}

export interface SeedBlockType {
  slug: string;
  label: string;
  category?: string;
  description?: string;
  icon?: string;
  currentVersion: number;
  versions: { version: number; fields: BlockField[] }[];
}

export interface BlockField {
  slug: string;
  label: string;
  type: string;
  required?: boolean;
  defaultValue?: unknown;
  validation?: unknown;
  options?: unknown;
}

/** A page as it is live in the CMS: published pages only. */
export interface LivePage {
  slug: string;
  data: PageData;
}

/** What the seed conversion of image fields needs: the live library and where the seed's references point. */
export interface MediaConversion {
  /** The library items by id; a live value whose item is known takes its file name and alt from the library. */
  mediaById?: ReadonlyMap<string, LibraryItem>;
  /** The base URL of the seed's `$media` references; the repository's captures on `main` by default. */
  base?: string;
}

/** Sort keys recursively and drop undefined values so two objects compare by content. */
export function canon(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canon);
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record).sort()) if (record[key] !== undefined) out[key] = canon(record[key]);
  return out;
}

export function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(canon(left)) === JSON.stringify(canon(right));
}

/** Paths where two values differ, at most `limit`. */
export function diffPaths(left: unknown, right: unknown, path = '', out: string[] = [], limit = 12): string[] {
  if (out.length >= limit) return out;
  if (Array.isArray(left) && Array.isArray(right)) {
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) diffPaths(left[index], right[index], `${path}[${index}]`, out, limit);
    return out;
  }
  if (left && right && typeof left === 'object' && typeof right === 'object' && !Array.isArray(left) && !Array.isArray(right)) {
    const l = left as Record<string, unknown>;
    const r = right as Record<string, unknown>;
    for (const key of new Set([...Object.keys(l), ...Object.keys(r)])) diffPaths(l[key], r[key], path ? `${path}.${key}` : key, out, limit);
    return out;
  }
  if (JSON.stringify(left) !== JSON.stringify(right)) out.push(path || '(value)');
  return out;
}

/** The content of a page as the site renders it: title, description and the blocks without `_version`. */
export function canonicalPage(data: PageData | undefined): unknown {
  return canon({
    title: data?.title,
    description: data?.description,
    layout: (Array.isArray(data?.layout) ? data.layout : []).map(({ _version, ...block }) => block),
  });
}

/** Block-field definitions in the shape the CMS stores and compares them. */
export function canonicalFields(fields: BlockField[] | undefined): unknown[] {
  return (fields ?? []).map((field) =>
    canon({
      slug: field.slug,
      label: field.label,
      type: field.type,
      required: field.required ?? false,
      defaultValue: field.defaultValue,
      validation: field.validation,
      options: field.options,
    }),
  );
}

/** The image fields of every block type's current version, by block type slug. */
export function imageFieldsOf(seed: SeedFile): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const type of seed.blockTypes ?? []) {
    const version = type.versions.find((candidate) => candidate.version === type.currentVersion) ?? type.versions[type.versions.length - 1];
    const fields = (version?.fields ?? []).filter((field) => field.type === 'image').map((field) => field.slug);
    if (fields.length) out.set(type.slug, fields);
  }
  return out;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The id and file name a live media value refers to, as the manifest's usage records them. */
export function mediaReference(value: unknown, mediaById?: ReadonlyMap<string, LibraryItem>): { id: string; filename: string | null } | null {
  if (isSeedMediaRef(value)) return { id: '', filename: seedRefFile(value) || null };
  if (!isRecord(value)) return null;
  const media = value as MediaValue;
  const id = typeof media.id === 'string' ? media.id : '';
  const key = storageKeyOf(media);
  if (!id && !key && !(typeof media.src === 'string' && media.src)) return null;
  const item = id ? mediaById?.get(id) : undefined;
  const filename = item?.filename ?? (typeof media.filename === 'string' && media.filename ? media.filename : key);
  return { id, filename: filename ?? null };
}

function seedMediaRef(value: unknown, conversion: MediaConversion): SeedMediaRef | undefined {
  const base = (conversion.base ?? SEED_MEDIA_BASE).replace(/\/+$/, '');
  if (isSeedMediaRef(value)) {
    const alt = typeof value.$media.alt === 'string' ? value.$media.alt : undefined;
    return { $media: { url: value.$media.url, ...(alt !== undefined ? { alt } : {}) } };
  }
  if (!isRecord(value)) return undefined;
  const media = value as MediaValue;
  if (media.provider && media.provider !== 'local') return undefined;
  const id = typeof media.id === 'string' ? media.id : '';
  const key = storageKeyOf(media);
  if (!id && !key) return undefined;
  const item = id ? conversion.mediaById?.get(id) : undefined;
  const filename = item?.filename ?? (typeof media.filename === 'string' && media.filename ? media.filename : key);
  if (!filename) return undefined;
  const alt = item?.alt ?? (typeof media.alt === 'string' ? media.alt : undefined);
  return { $media: { url: `${base}/${encodeURIComponent(filename)}`, ...(alt ? { alt } : {}) } };
}

/**
 * A live image value in the seed's form: the `$media` reference of the
 * primary and, nested, of the dark variant. A value the site cannot serve
 * (an external URL, no storage key) is written as nothing; the manifest's
 * usage still records it so the audit flags it.
 */
export function seedImageValue(value: unknown, conversion: MediaConversion = {}): SeedImageValue | undefined {
  const primary = seedMediaRef(value, conversion);
  if (!primary) return undefined;
  const dark = isRecord(value) ? seedMediaRef(value.darkVariant, conversion) : undefined;
  return dark ? { ...primary, darkVariant: dark } : primary;
}

/**
 * A live page's data in seed form: the known fields, blocks at version 1 with
 * `_type`, `_version`, `_key` first, and every image field as a `$media`
 * reference (`imageFields` names them by block type).
 */
export function seedPageData(data: PageData, fieldSlugs: string[], imageFields: ReadonlyMap<string, string[]> = new Map(), conversion: MediaConversion = {}): PageData {
  const out: PageData = {};
  for (const slug of fieldSlugs) {
    if (slug === 'layout') {
      out.layout = (Array.isArray(data.layout) ? data.layout : []).map((block) => {
        const { _type, _version, _key, ...rest } = block;
        const converted: Record<string, unknown> = { ...rest };
        for (const field of imageFields.get(_type) ?? []) {
          if (!(field in converted)) continue;
          const seedValue = seedImageValue(converted[field], conversion);
          if (seedValue) converted[field] = seedValue;
          else delete converted[field];
        }
        return { _type, _version: 1, ...(_key !== undefined ? { _key } : {}), ...converted };
      });
    } else if (data[slug] !== undefined && data[slug] !== null) {
      out[slug] = data[slug];
    }
  }
  return out;
}

/** The field slugs of a collection as the repository declares them. */
export function collectionFields(seed: SeedFile, collection: string): string[] {
  const declared = seed.collections?.find((entry) => entry.slug === collection)?.fields.map((field) => field.slug);
  return declared && declared.length ? declared : ['title', 'description', 'layout'];
}

/**
 * The seed with `content.pages` replaced by what is live. Pages keep the
 * repository's order; new slugs follow in alphabetical order; a page the
 * repository lists that is no longer live keeps its last data and becomes a
 * draft, so the fallback never serves content the CMS retired and the
 * content tests say so.
 */
export function mirrorPages(seed: SeedFile, live: LivePage[], collection = 'pages', conversion: MediaConversion = {}): SeedFile {
  const fields = collectionFields(seed, collection);
  const imageFields = imageFieldsOf(seed);
  const current = seed.content?.[collection];
  const existing: SeedPage[] = Array.isArray(current) ? (current as SeedPage[]) : [];
  const liveBySlug = new Map(live.map((page) => [page.slug, page]));
  const pages: SeedPage[] = existing.map((page) => {
    const now = liveBySlug.get(page.slug);
    liveBySlug.delete(page.slug);
    // Keep the entry's own keys (the seed `id` that references use) and replace only status and data.
    return now ? { ...page, status: 'published', data: seedPageData(now.data, fields, imageFields, conversion) } : { ...page, status: 'draft', data: page.data };
  });
  for (const slug of [...liveBySlug.keys()].sort()) pages.push({ id: slug, slug, status: 'published', data: seedPageData(liveBySlug.get(slug)!.data, fields, imageFields, conversion) } as SeedPage);
  return { ...seed, content: { ...(seed.content ?? {}), [collection]: pages } };
}

export interface PageDifference {
  slug: string;
  kind: 'status' | 'content' | 'missing-in-cms' | 'missing-in-repo';
  detail: string;
}

/** Where the repository's pages differ from what is live. Empty when the repository equals the CMS. */
export function pageDifferences(seed: SeedFile, live: LivePage[], collection = 'pages', conversion: MediaConversion = {}): PageDifference[] {
  const fields = collectionFields(seed, collection);
  const imageFields = imageFieldsOf(seed);
  const current = seed.content?.[collection];
  const existing: SeedPage[] = Array.isArray(current) ? (current as SeedPage[]) : [];
  const liveBySlug = new Map(live.map((page) => [page.slug, page]));
  const out: PageDifference[] = [];
  for (const page of existing) {
    const now = liveBySlug.get(page.slug);
    liveBySlug.delete(page.slug);
    const wanted = page.status ?? 'published';
    if (!now) {
      if (wanted === 'published') out.push({ slug: page.slug, kind: 'missing-in-cms', detail: 'published in the repository, not live in the CMS' });
      continue;
    }
    if (wanted !== 'published') {
      out.push({ slug: page.slug, kind: 'status', detail: `live in the CMS, ${wanted} in the repository` });
      continue;
    }
    const paths = diffPaths(canonicalPage(page.data), canonicalPage(seedPageData(now.data, fields, imageFields, conversion)));
    if (paths.length) out.push({ slug: page.slug, kind: 'content', detail: paths.join(', ') });
  }
  for (const slug of [...liveBySlug.keys()].sort()) out.push({ slug, kind: 'missing-in-repo', detail: 'live in the CMS, absent from the repository' });
  return out;
}

/** The seed file's text as the repository formats it. */
export function serializeSeed(seed: SeedFile): string {
  return `${JSON.stringify(seed, null, 2)}\n`;
}

function sortLibrary(items: LibraryItem[]): LibraryItem[] {
  return [...items]
    .map((item) => ({
      id: item.id,
      filename: item.filename,
      mimeType: item.mimeType,
      size: item.size ?? null,
      width: item.width ?? null,
      height: item.height ?? null,
      alt: item.alt ?? null,
      contentHash: item.contentHash ?? null,
      storageKey: item.storageKey,
      status: item.status,
    }))
    .sort((left, right) => left.filename.localeCompare(right.filename) || left.id.localeCompare(right.id));
}

/**
 * Which block uses which media item, from the live pages: one row per image
 * field of every block whose type declares one, in the repository's page
 * order. A block without an image records null, which the audit flags.
 */
export function mediaUsageOf(seed: SeedFile, live: LivePage[], mediaById?: ReadonlyMap<string, LibraryItem>, collection = 'pages'): MediaUsage[] {
  const imageFields = imageFieldsOf(seed);
  const current = seed.content?.[collection];
  const order = (Array.isArray(current) ? (current as SeedPage[]) : []).map((page) => page.slug);
  const sorted = [...live].sort((left, right) => {
    const l = order.indexOf(left.slug);
    const r = order.indexOf(right.slug);
    if (l !== -1 || r !== -1) return (l === -1 ? Infinity : l) - (r === -1 ? Infinity : r);
    return left.slug.localeCompare(right.slug);
  });
  const usage: MediaUsage[] = [];
  for (const page of sorted) {
    for (const block of Array.isArray(page.data.layout) ? page.data.layout : []) {
      for (const field of imageFields.get(block._type) ?? []) {
        const value = block[field];
        usage.push({
          page: page.slug,
          block: typeof block._key === 'string' ? block._key : '',
          type: block._type,
          field,
          image: mediaReference(value, mediaById),
          darkVariant: isRecord(value) ? mediaReference(value.darkVariant, mediaById) : null,
        });
      }
    }
  }
  return usage;
}

/** The manifest with the mirror's sections replaced: the live library and its usage; the approved captures stay the repository's. */
export function mirrorManifest(previous: MediaManifest, library: LibraryItem[], live: LivePage[], seed: SeedFile, collection = 'pages'): MediaManifest {
  const sorted = sortLibrary(library);
  const byId = new Map(sorted.map((item) => [item.id, item]));
  const { base, approved, library: _library, usage: _usage, ...rest } = previous;
  return { base: base ?? SEED_MEDIA_BASE, approved: approved ?? [], library: sorted, usage: mediaUsageOf(seed, live, byId, collection), ...rest };
}

/** The media manifest's text as the repository formats it. */
export function serializeManifest(manifest: MediaManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/** Where two manifests differ, in words for a PR body or a report. */
export function manifestDifferences(before: MediaManifest, after: MediaManifest): string[] {
  const out: string[] = [];
  const key = (item: LibraryItem) => `${item.id} ${item.filename}`;
  const was = new Map((before.library ?? []).map((item) => [item.id, item]));
  const now = new Map((after.library ?? []).map((item) => [item.id, item]));
  for (const item of after.library ?? []) {
    const previous = was.get(item.id);
    if (!previous) out.push(`library: ${key(item)} added`);
    else if (!same(previous, item)) out.push(`library: ${key(item)} changed (${diffPaths(previous, item).join(', ')})`);
  }
  for (const item of before.library ?? []) if (!now.has(item.id)) out.push(`library: ${key(item)} removed`);
  const usageKey = (row: MediaUsage) => `${row.page}/${row.block}.${row.field}`;
  const usageWas = new Map((before.usage ?? []).map((row) => [usageKey(row), row]));
  const usageNow = new Map((after.usage ?? []).map((row) => [usageKey(row), row]));
  const describe = (row: MediaUsage) => `${row.image ? (row.image.filename ?? row.image.id) : 'none'}${row.darkVariant ? ` with dark variant ${row.darkVariant.filename ?? row.darkVariant.id}` : ''}`;
  for (const [id, row] of usageNow) {
    const previous = usageWas.get(id);
    if (!previous) out.push(`usage: ${id} now ${describe(row)}`);
    else if (!same(previous, row)) out.push(`usage: ${id} ${describe(previous)} -> ${describe(row)}`);
  }
  for (const id of usageWas.keys()) if (!usageNow.has(id)) out.push(`usage: ${id} gone`);
  return out;
}

/** The capture a library item is a cut of, by the approved naming; null when the file is not named that way. */
export function libraryCapture(item: Pick<LibraryItem, 'filename'>): string {
  return captureName(item.filename);
}
