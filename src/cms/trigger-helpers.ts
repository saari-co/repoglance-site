/**
 * Pure helpers for the mirror trigger (src/cms/mirror-trigger.ts): which
 * requests change live content, how to read the entry's slug from EmDash's
 * response, how to read the live pages from D1, and how to build the failure
 * email. No Astro or Cloudflare imports, so the unit tests run them.
 */
import type { LivePage } from '../content/cms-shape.ts';
import type { MirrorEmail, MirrorTrigger } from './mirror.ts';

export type LiveChangeAction = Exclude<MirrorTrigger['action'], 'manual'>;

const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;
const ENTRY = '([a-z0-9_-]+)/([^/]+)';

/**
 * The requests after which live content may differ: the admin's publish,
 * unpublish, restore from the trash and trash/permanent delete of an entry,
 * and the on-page visual-editing toolbar's publish. A draft write (PUT) never
 * changes what is live and is not a trigger; a scheduled publish fires from
 * the cron, not from a request, and is mirrored at the next admin action or by
 * `npm run cms:mirror` (a recorded limit).
 */
const ROUTES: { method: string; pattern: RegExp; action: LiveChangeAction }[] = [
  { method: 'POST', pattern: new RegExp(`^/_emdash/api/content/${ENTRY}/publish$`), action: 'publish' },
  { method: 'POST', pattern: new RegExp(`^/_emdash/api/visual-editing/content/${ENTRY}/publish$`), action: 'publish' },
  { method: 'POST', pattern: new RegExp(`^/_emdash/api/content/${ENTRY}/unpublish$`), action: 'unpublish' },
  { method: 'POST', pattern: new RegExp(`^/_emdash/api/content/${ENTRY}/restore$`), action: 'restore' },
  { method: 'DELETE', pattern: new RegExp(`^/_emdash/api/content/${ENTRY}$`), action: 'delete' },
  { method: 'DELETE', pattern: new RegExp(`^/_emdash/api/content/${ENTRY}/permanent$`), action: 'delete' },
];

export interface TriggerMatch {
  collection: string;
  id: string;
  action: LiveChangeAction;
}

/** The live-content change a request performs, or null when it is not one. */
export function matchTrigger(method: string, pathname: string): TriggerMatch | null {
  const upper = method.toUpperCase();
  for (const route of ROUTES) {
    if (route.method !== upper) continue;
    const match = route.pattern.exec(pathname);
    if (!match) continue;
    let id: string;
    try {
      id = decodeURIComponent(match[2]);
    } catch {
      id = match[2];
    }
    return { collection: match[1], id, action: route.action };
  }
  return null;
}

/** The entry's slug from EmDash's `{ data: { item } }` response, when it can be read. */
export async function slugFromResponse(response: Response): Promise<string | undefined> {
  try {
    const json = (await response.clone().json()) as { data?: { item?: { slug?: unknown } } };
    const slug = json?.data?.item?.slug;
    return typeof slug === 'string' && slug ? slug : undefined;
  } catch {
    return undefined;
  }
}

export interface FieldDeclaration {
  slug: string;
  type: string;
}

/** Field types EmDash stores as JSON text in the entry's column. */
const JSON_TYPES = new Set(['blocks', 'json', 'repeater', 'richtext', 'object', 'array', 'media', 'relation', 'reference', 'references']);

export function deserializeField(value: unknown, type: string): unknown {
  if (typeof value !== 'string' || !JSON_TYPES.has(type)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export interface D1Like {
  prepare(query: string): { all<T = Record<string, unknown>>(): Promise<{ results: T[] }> };
}

/**
 * The published pages from EmDash's content table for the collection
 * (`ec_<collection>`, one column per field, live data in the row itself while
 * drafts live in revisions), with the fields the repository declares.
 */
export async function readLivePagesFromD1(db: D1Like, fields: FieldDeclaration[], collection = 'pages'): Promise<LivePage[]> {
  if (!IDENTIFIER.test(collection) || fields.some((field) => !IDENTIFIER.test(field.slug))) throw new Error('invalid collection or field identifier');
  const columns = ['slug', ...fields.map((field) => field.slug)].map((name) => `"${name}"`).join(', ');
  const { results } = await db.prepare(`SELECT ${columns} FROM "ec_${collection}" WHERE deleted_at IS NULL AND status = 'published' ORDER BY slug`).all();
  return results.map((row) => ({
    slug: String(row.slug),
    data: Object.fromEntries(fields.map((field) => [field.slug, deserializeField(row[field.slug], field.type)])),
  }));
}

/** One plain-text message for the Email Routing binding. */
export function rawEmail(message: MirrorEmail, id: string, date: Date): string {
  const clean = (value: string) => value.replace(/[\r\n]+/g, ' ');
  return [
    `From: ${clean(message.from)}`,
    `To: ${clean(message.to)}`,
    `Subject: ${clean(message.subject)}`,
    `Date: ${date.toUTCString()}`,
    `Message-ID: <${id}@repoglance.com>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    message.text,
  ].join('\r\n');
}
