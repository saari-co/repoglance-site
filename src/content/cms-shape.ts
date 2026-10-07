/**
 * Pure shaping shared by the Worker-side mirror (src/cms/mirror.ts) and the
 * Node scripts (scripts/cms-mirror.mjs, scripts/cms-sync.mjs). No Astro, no
 * Node, no network: the unit tests run it directly.
 *
 * Decision cms-first-013: the CMS owns content, the repository owns
 * structure. A mirrored seed keeps everything the repository says (schema,
 * collections, meta, block types) and replaces only `content.pages` with
 * what is live in the CMS. Block `_version` is written as 1, the seed's
 * fresh-install version; the CMS's version numbers follow its own history.
 */

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

/** A live page's data in seed form: the known fields, blocks at version 1 with `_type`, `_version`, `_key` first. */
export function seedPageData(data: PageData, fieldSlugs: string[]): PageData {
  const out: PageData = {};
  for (const slug of fieldSlugs) {
    if (slug === 'layout') {
      out.layout = (Array.isArray(data.layout) ? data.layout : []).map((block) => {
        const { _type, _version, _key, ...rest } = block;
        return { _type, _version: 1, ...(_key !== undefined ? { _key } : {}), ...rest };
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
export function mirrorPages(seed: SeedFile, live: LivePage[], collection = 'pages'): SeedFile {
  const fields = collectionFields(seed, collection);
  const current = seed.content?.[collection];
  const existing: SeedPage[] = Array.isArray(current) ? (current as SeedPage[]) : [];
  const liveBySlug = new Map(live.map((page) => [page.slug, page]));
  const pages: SeedPage[] = existing.map((page) => {
    const now = liveBySlug.get(page.slug);
    liveBySlug.delete(page.slug);
    // Keep the entry's own keys (the seed `id` that references use) and replace only status and data.
    return now ? { ...page, status: 'published', data: seedPageData(now.data, fields) } : { ...page, status: 'draft', data: page.data };
  });
  for (const slug of [...liveBySlug.keys()].sort()) pages.push({ id: slug, slug, status: 'published', data: seedPageData(liveBySlug.get(slug)!.data, fields) } as SeedPage);
  return { ...seed, content: { ...(seed.content ?? {}), [collection]: pages } };
}

export interface PageDifference {
  slug: string;
  kind: 'status' | 'content' | 'missing-in-cms' | 'missing-in-repo';
  detail: string;
}

/** Where the repository's pages differ from what is live. Empty when the repository equals the CMS. */
export function pageDifferences(seed: SeedFile, live: LivePage[], collection = 'pages'): PageDifference[] {
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
    const paths = diffPaths(canonicalPage(page.data), canonicalPage(now.data));
    if (paths.length) out.push({ slug: page.slug, kind: 'content', detail: paths.join(', ') });
  }
  for (const slug of [...liveBySlug.keys()].sort()) out.push({ slug, kind: 'missing-in-repo', detail: 'live in the CMS, absent from the repository' });
  return out;
}

/** The seed file's text as the repository formats it. */
export function serializeSeed(seed: SeedFile): string {
  return `${JSON.stringify(seed, null, 2)}\n`;
}
