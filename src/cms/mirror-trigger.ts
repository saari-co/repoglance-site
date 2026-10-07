import { defineMiddleware } from 'astro:middleware';
import { EmailMessage } from 'cloudflare:email';
import { env as workerEnv, waitUntil } from 'cloudflare:workers';
import seed from '../../seed/seed.json';
import type { SeedFile } from '../content/cms-shape.ts';
import { runMirror, type MirrorEnv, type MirrorTrigger } from './mirror.ts';
import { matchTrigger, rawEmail, readLivePagesFromD1, slugFromResponse, type D1Like, type FieldDeclaration } from './trigger-helpers.ts';

/**
 * Outer middleware after the namespace guard (src/outer-middleware.ts). A
 * successful request that changes live content (publish, unpublish, restore,
 * trash or permanent delete of a page, the visual-editing toolbar's publish;
 * see trigger-helpers.ts) schedules the mirror after the response is sent, so
 * the editor's click is never slowed. Everything the mirror needs comes from
 * the Worker's bindings: the live pages from D1, GitHub through the token
 * secret, the failure email through the `send_email` binding; the mirror says
 * in its log when it is not configured.
 */
const COLLECTION = 'pages';

interface WorkerBindings extends MirrorEnv {
  DB?: D1Like;
  MIRROR_EMAIL?: { send(message: EmailMessage): Promise<void> };
}

function bindings(): WorkerBindings {
  try {
    return (workerEnv as unknown as WorkerBindings) ?? {};
  } catch {
    return {};
  }
}

/** The collection's fields as the repository declares them. */
function declaredFields(): FieldDeclaration[] {
  const collection = (seed as unknown as SeedFile).collections?.find((entry) => entry.slug === COLLECTION);
  const fields = collection?.fields.map((field) => ({ slug: field.slug, type: field.type })) ?? [];
  return fields.length ? fields : [{ slug: 'title', type: 'string' }, { slug: 'description', type: 'text' }, { slug: 'layout', type: 'blocks' }];
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
  const match = matchTrigger(context.request.method, context.url.pathname);
  if (!match || match.collection !== COLLECTION || !response.ok) return response;
  const trigger: MirrorTrigger = {
    ...match,
    slug: await slugFromResponse(response),
    editor: (context.locals as { user?: { name?: string } }).user?.name,
  };
  const env = bindings();
  const fields = declaredFields();
  const task = runMirror(trigger, {
    env,
    fetch: globalThis.fetch.bind(globalThis),
    readLivePages: async () => {
      if (!env.DB) throw new Error('the DB binding is missing');
      return readLivePagesFromD1(env.DB, fields, COLLECTION);
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
