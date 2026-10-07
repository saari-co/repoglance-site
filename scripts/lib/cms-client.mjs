/**
 * The EmDash API client the CMS scripts share (cms-first-013): the identity
 * ladder, the client, and the reads of block types and pages.
 *
 * Identity, in this order (values are never printed):
 *   EMDASH_TOKEN                   an EmDash API token (Bearer)
 *   localhost / 127.0.0.1          EmDash's development bypass
 *   EMDASH_HEADERS or --header     custom headers, e.g. a Cloudflare Access
 *                                  service token (CF-Access-Client-Id/Secret)
 *   otherwise                      the Access JWT cloudflared cached for
 *                                  <origin>/_emdash after
 *                                  `cloudflared access login <origin>/_emdash`
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { EmDashApiError, EmDashClient } from 'emdash/client';
import { customHeadersInterceptor, parseHeadersFromEnv, parseHeaderStrings } from 'emdash/client/cf-access';

const execFileAsync = promisify(execFile);

export { EmDashApiError };

export const IDENTITY_HELP = [
  'Identity (values are never printed): EMDASH_TOKEN (Bearer); the development bypass on localhost;',
  'EMDASH_HEADERS or --header "Name: Value" (e.g. a Cloudflare Access service token);',
  'otherwise the Access JWT cloudflared cached after `cloudflared access login <origin>/_emdash`.',
].join('\n');

function hasHeader(headers, name) {
  return Object.keys(headers).some((key) => key.toLowerCase() === name);
}

async function cloudflaredToken(app) {
  try {
    const { stdout } = await execFileAsync('cloudflared', ['access', 'token', '-app', app]);
    const token = stdout.trim();
    return /^[\w-]+\.[\w-]+\.[\w-]+$/.test(token) ? token : null;
  } catch {
    return null;
  }
}

/** Resolve how to sign in to `base`. Throws with the sign-in instruction when nothing applies. */
export async function resolveIdentity(base, headerArgs = []) {
  const origin = new URL(base).origin;
  const appUrl = `${origin}/_emdash`;
  const headers = { ...parseHeadersFromEnv(), ...parseHeaderStrings(headerArgs) };
  const token = process.env.EMDASH_TOKEN?.trim();
  if (token) return { token, headers, label: 'EmDash API token (EMDASH_TOKEN)' };
  if (/^(localhost|127\.0\.0\.1)$/.test(new URL(base).hostname)) return { devBypass: true, headers, label: `EmDash development bypass on ${origin}` };
  if (hasHeader(headers, 'cf-access-client-id') || hasHeader(headers, 'cf-access-token')) return { headers, label: 'custom headers (EMDASH_HEADERS / --header)' };
  const jwt = await cloudflaredToken(appUrl);
  if (!jwt) {
    throw new Error(`no identity for ${origin}. Sign in once with your own Access login:\n  cloudflared access login ${appUrl}\nthen run this again (the login is cached for the Access session length).`);
  }
  return { headers: { ...headers, 'cf-access-token': jwt }, label: `cloudflared's cached Access login for ${appUrl}` };
}

export function createClient(base, identity) {
  return new EmDashClient({
    baseUrl: base,
    ...(identity.token ? { token: identity.token } : {}),
    ...(identity.devBypass ? { devBypass: true } : {}),
    interceptors: [customHeadersInterceptor(identity.headers)],
  });
}

export async function getOrNull(client, path) {
  try {
    return await client.request('GET', path);
  } catch (error) {
    if (error instanceof EmDashApiError && error.status === 404) return null;
    throw error;
  }
}

/** Every block type in the CMS by slug (full items with versions). */
export async function readBlockTypes(client) {
  const listed = await client.request('GET', '/schema/block-types');
  const bySlug = new Map();
  for (const summary of listed.items ?? []) {
    const found = await getOrNull(client, `/schema/block-types/${encodeURIComponent(summary.slug)}`);
    if (found?.item) bySlug.set(summary.slug, found.item);
  }
  return bySlug;
}

/**
 * Every entry of a collection, newest data first: `{ slug, status, live, draft, item }`
 * where `live` is the published data (or null) and `draft` the pending draft (or null).
 */
export async function readEntries(client, collection) {
  const entries = [];
  let cursor;
  do {
    const query = new URLSearchParams({ limit: '100' });
    if (cursor) query.set('cursor', cursor);
    const page = await client.request('GET', `/content/${collection}?${query}`);
    for (const summary of page.items ?? []) {
      const found = await getOrNull(client, `/content/${collection}/${encodeURIComponent(summary.id)}`);
      if (!found?.item) continue;
      const item = { ...found.item, _rev: found._rev };
      const draft = item.draftRevisionId ? item.data : null;
      const live = item.status === 'published' ? (item.liveData ?? item.data) : null;
      entries.push({ slug: item.slug, status: item.status, live, draft, item });
    }
    cursor = page.nextCursor;
  } while (cursor);
  return entries;
}

/** The pages that are live: published entries with their live data. */
export function livePages(entries) {
  return entries.filter((entry) => entry.status === 'published' && entry.live).map((entry) => ({ slug: entry.slug, data: entry.live }));
}

export function describeApiError(error) {
  if (error instanceof EmDashApiError) return `${error.status} ${error.code}: ${error.message}${error.details ? ` ${JSON.stringify(error.details)}` : ''}`;
  return error instanceof Error ? error.message : String(error);
}
