import { defineMiddleware } from 'astro:middleware';
import { EmailMessage } from 'cloudflare:email';
import { env as workerEnv, waitUntil } from 'cloudflare:workers';
import seed from '../../seed/seed.json';
import { collectionFields, type LivePage, type SeedFile } from '../content/cms-shape.ts';
import { runMirror, type MirrorEmail, type MirrorEnv, type MirrorTrigger } from './mirror.ts';

/**
 * Outer middleware after the namespace guard (src/outer-middleware.ts). A
 * successful `POST /_emdash/api/content/pages/{id}/publish` or
 * `.../unpublish` schedules the mirror after the response is sent, so the
 * editor's click is never slowed. Everything the mirror needs comes from the
 * Worker's bindings: the live pages from D1, GitHub through the token
 * secret, the failure email through the `send_email` binding; each is
 * optional, and the mirror says so in its log when one is missing.
 */
const PUBLISH_ROUTE = /^\/_emdash\/api\/content\/([a-z0-9_-]+)\/([^/]+)\/(publish|unpublish)$/;
const COLLECTION = 'pages';
const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

interface WorkerBindings extends MirrorEnv {
  DB?: { prepare(query: string): { all<T = Record<string, unknown>>(): Promise<{ results: T[] }> } };
  MIRROR_EMAIL?: { send(message: EmailMessage): Promise<void> };
}

function bindings(): WorkerBindings {
  try {
    return (workerEnv as unknown as WorkerBindings) ?? {};
  } catch {
    return {};
  }
}

function deserialize(value: unknown): unknown {
  if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

/** The published pages from EmDash's content table for the collection (`ec_<collection>`), field columns as the repository declares them. */
export async function readLivePagesFromD1(db: NonNullable<WorkerBindings['DB']>, fields: string[], collection = COLLECTION): Promise<LivePage[]> {
  if (!IDENTIFIER.test(collection) || fields.some((field) => !IDENTIFIER.test(field))) throw new Error('invalid collection or field identifier');
  const columns = ['slug', ...fields].map((name) => `"${name}"`).join(', ');
  const { results } = await db.prepare(`SELECT ${columns} FROM "ec_${collection}" WHERE deleted_at IS NULL AND status = 'published' ORDER BY slug`).all();
  return results.map((row) => ({
    slug: String(row.slug),
    data: Object.fromEntries(fields.map((field) => [field, deserialize(row[field])])),
  }));
}

/** One plain-text message through the Email Routing binding. */
export function rawEmail(message: MirrorEmail, id: string, date: Date): string {
  return [
    `From: ${message.from}`,
    `To: ${message.to}`,
    `Subject: ${message.subject}`,
    `Date: ${date.toUTCString()}`,
    `Message-ID: <${id}@repoglance.com>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    message.text,
  ].join('\r\n');
}

/** The entry's slug from EmDash's publish/unpublish response (`{ data: { item } }`), when it can be read. */
async function slugFromResponse(response: Response): Promise<string | undefined> {
  try {
    const json = (await response.clone().json()) as { data?: { item?: { slug?: unknown } } };
    const slug = json?.data?.item?.slug;
    return typeof slug === 'string' && slug ? slug : undefined;
  } catch {
    return undefined;
  }
}

function schedule(task: Promise<unknown>): Promise<unknown> | undefined {
  try {
    waitUntil(task);
    return undefined;
  } catch {
    return task;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  if (context.request.method !== 'POST') return response;
  const match = PUBLISH_ROUTE.exec(context.url.pathname);
  if (!match || match[1] !== COLLECTION || !response.ok) return response;
  const trigger: MirrorTrigger = {
    collection: match[1],
    id: decodeURIComponent(match[2]),
    slug: await slugFromResponse(response),
    action: match[3] as MirrorTrigger['action'],
    editor: (context.locals as { user?: { name?: string } }).user?.name,
  };
  const env = bindings();
  const fields = collectionFields(seed as unknown as SeedFile, COLLECTION);
  const task = runMirror(trigger, {
    env,
    fetch: globalThis.fetch.bind(globalThis),
    readLivePages: async () => {
      if (!env.DB) throw new Error('the DB binding is missing');
      return readLivePagesFromD1(env.DB, fields);
    },
    sendEmail: env.MIRROR_EMAIL
      ? async (message) => {
          await env.MIRROR_EMAIL!.send(new EmailMessage(message.from, message.to, rawEmail(message, crypto.randomUUID(), new Date())));
        }
      : undefined,
  }).catch((error) => {
    console.error('[cms-mirror] unexpected failure', error);
  });
  const inline = schedule(task);
  if (inline) await inline;
  return response;
});
