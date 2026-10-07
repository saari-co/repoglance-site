/**
 * Pure decision logic for the /_emdash namespace. No Astro imports, so the
 * unit tests run it directly.
 */
import { CAPTURES_PATH, RENDER_FORMAT, RENDER_WIDTHS, publicMediaKey } from './content/media.ts';

export const NAMESPACE = '/_emdash';
export const TEAM_DOMAIN_ENV = 'EMDASH_ACCESS_TEAM_DOMAIN';
export const AUDIENCE_ENV = 'CF_ACCESS_AUDIENCE';
export const ALLOWLIST_ENV = 'EMDASH_OPERATOR_ALLOWLIST';

export interface GateEnv {
  [TEAM_DOMAIN_ENV]?: string;
  [AUDIENCE_ENV]?: string;
  [ALLOWLIST_ENV]?: string;
}

export interface GateIdentity {
  email?: string;
}

/**
 * A Cloudflare Access service token's identity: the JWT carries the token's
 * client id as `common_name` and no email (decision cms-first-013).
 */
export interface MachineIdentity {
  commonName?: string;
  email?: string;
}

export type Authenticate = (request: Request, config: { teamDomain: string; audienceEnvVar: string }) => Promise<GateIdentity | null | undefined>;
export type VerifyMachine = (request: Request, config: { teamDomain: string; audienceEnvVar: string }) => Promise<MachineIdentity | null | undefined>;

export interface GateInput {
  pathname: string;
  request: Request;
  env: GateEnv;
  authenticate: Authenticate;
  /** Verifies an Access JWT itself and returns its claims; absent means no machine identities are admitted. */
  verifyMachine?: VerifyMachine;
  dev?: boolean;
}

export type GateReason =
  | 'public'
  | 'public-media'
  | 'public-rendition'
  | 'dev'
  | 'access-not-configured'
  | 'no-identity'
  | 'not-on-allowlist'
  | 'operator'
  | 'machine-read'
  | 'machine-draft'
  | 'machine-create-draft'
  | 'machine-preview'
  | 'machine-no-bearer'
  | 'machine-draft-rules'
  | 'machine-forbidden';

export interface GateDecision {
  allow: boolean;
  reason: GateReason;
}

/** Decode the way Astro routing does, then collapse repeated slashes. */
export function canonicalPathname(pathname: string): string {
  let path = pathname;
  for (let round = 0; round < 3; round += 1) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(path);
    } catch {
      break;
    }
    if (decoded === path) break;
    path = decoded;
  }
  return path.replace(/\/{2,}/g, '/');
}

export function isEmdashNamespace(pathname: string): boolean {
  const path = canonicalPathname(pathname).toLowerCase();
  return path === NAMESPACE || path.startsWith(`${NAMESPACE}/`);
}

/** The pathname of the request itself, independent of Astro's parsed URL. */
export function requestPathname(request: Request): string {
  try {
    return new URL(request.url).pathname;
  } catch {
    return '/';
  }
}

/**
 * The one anonymous read inside the namespace (decision media-library-014):
 * a GET or HEAD of the public media-file route, `/_emdash/api/media/file/
 * <key>`, where the key is the flat `{ulid}{ext}` shape EmDash's upload
 * pipeline produces. Every candidate pathname (Astro's parsed one and the
 * request's own) must already be that path in its canonical form, so an
 * encoded, doubled-slash or traversal spelling is never admitted even when
 * Astro's routing would collapse it onto the route. Returns the key, or
 * null when the request is not such a read. The media list, uploads,
 * folders and every other media route stay behind Access.
 */
export function publicMediaRead(method: string, pathnames: string[]): string | null {
  const upper = method.toUpperCase();
  if (upper !== 'GET' && upper !== 'HEAD') return null;
  const keys = pathnames.map((pathname) => (canonicalPathname(pathname) === pathname ? publicMediaKey(pathname) : null));
  const key = keys[0];
  if (!key || keys.some((candidate) => candidate !== key)) return null;
  return key;
}

/** Whether a pathname is Astro's image endpoint (`/_image` unless the site configures another route). */
export function isImageEndpoint(pathname: string, route = '/_image'): boolean {
  const wanted = `/${route.replace(/^\/+|\/+$/g, '')}`;
  return canonicalPathname(pathname).replace(/\/+$/, '') === wanted;
}

const CAPTURE_FILE = /^[A-Za-z0-9._-]+\.webp$/;

/**
 * Whether an image-endpoint request is one of the site's own renditions
 * (decision media-library-014): a repository capture (one of the approved
 * files when the set is given) or a Media Library file at one of the
 * widths and in the format `Screenshot.astro` emits, spelled exactly as
 * the pages emit it (the same keys in the same order and encoding), so
 * every spelling of one rendition is one cache key. The endpoint would
 * otherwise transform any allowed source at any size on request, each a
 * separate edge entry and an Images transform; anonymous visitors get
 * only what the pages ask for.
 */
export function isSiteRendition(url: URL, approvedFiles?: ReadonlySet<string>): boolean {
  const params = url.searchParams;
  const keys = [...params.keys()];
  if (keys.length !== 3 || keys[0] !== 'href' || keys[1] !== 'w' || keys[2] !== 'f') return false;
  if (!RENDER_WIDTHS.some((width) => String(width) === params.get('w')) || params.get('f') !== RENDER_FORMAT) return false;
  if (url.search.slice(1) !== params.toString()) return false;
  const href = params.get('href') ?? '';
  if (href.startsWith(`${CAPTURES_PATH}/`)) {
    const file = href.slice(CAPTURES_PATH.length + 1);
    return CAPTURE_FILE.test(file) && (approvedFiles ? approvedFiles.has(file) : true);
  }
  return publicMediaKey(href) !== null;
}

/**
 * The human path of the gate: Access configured, the official
 * authentication yielding an email, the allowlist honoured.
 */
async function evaluateOperator(input: GateInput, config: { teamDomain: string; audienceEnvVar: string }): Promise<{ decision: GateDecision; email?: string }> {
  let identity: GateIdentity | null | undefined;
  try {
    identity = await input.authenticate(input.request, config);
  } catch {
    identity = null;
  }
  const email = identity?.email?.trim().toLowerCase();
  if (!email) return { decision: { allow: false, reason: 'no-identity' } };
  const allowlist = parseAllowlist(input.env[ALLOWLIST_ENV]);
  if (allowlist.length > 0 && !allowlist.includes(email)) return { decision: { allow: false, reason: 'not-on-allowlist' }, email };
  return { decision: { allow: true, reason: 'operator' }, email };
}

function accessConfig(env: GateEnv): { teamDomain: string; audienceEnvVar: string } | null {
  const teamDomain = env[TEAM_DOMAIN_ENV]?.trim();
  const audience = env[AUDIENCE_ENV]?.trim();
  return teamDomain && audience ? { teamDomain, audienceEnvVar: AUDIENCE_ENV } : null;
}

export interface ImageGateInput extends GateInput {
  /** The approved capture files; a repository rendition must name one. */
  approvedFiles?: ReadonlySet<string>;
}

/**
 * The decision for a request to Astro's image endpoint (decision
 * media-library-014): one of the site's own renditions is public and
 * cached like the pages; anything else (the admin's Media gallery asks for
 * 400 px thumbnails of library files, the editor's own preview for other
 * sizes) is served, uncached, to an operator Access admits, and answers
 * 404 to everyone else. Machine identities have no business with images.
 */
export async function evaluateImageRequest(input: ImageGateInput): Promise<GateDecision> {
  const method = input.request.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') return { allow: false, reason: 'machine-forbidden' };
  let url: URL;
  try {
    url = new URL(input.request.url);
  } catch {
    return { allow: false, reason: 'machine-forbidden' };
  }
  if (isSiteRendition(url, input.approvedFiles)) return { allow: true, reason: 'public-rendition' };
  if (input.dev) return { allow: true, reason: 'dev' };
  const config = accessConfig(input.env);
  if (!config) return { allow: false, reason: 'access-not-configured' };
  return (await evaluateOperator(input, config)).decision;
}

function parseAllowlist(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

const MACHINE_READ = /^\/_emdash\/api\/(content|schema)(\/|$)/;
/** Reads of user data a machine has no business with: a collection's authors list carries operator addresses. */
const MACHINE_READ_DENIED = /\/authors$/;
const MACHINE_ENTRY = /^\/_emdash\/api\/content\/[a-z0-9_-]+\/[^/]+$/;
const MACHINE_COLLECTION = /^\/_emdash\/api\/content\/[a-z0-9_-]+$/;
const MACHINE_PREVIEW = /^\/_emdash\/api\/content\/[a-z0-9_-]+\/[^/]+\/preview-url$/;
const MAX_BODY_BYTES = 1_000_000;
/**
 * What a draft write may carry: the content and the revision it builds on.
 * Everything else is a human's call: overrideLock, publishedAt, authorId,
 * bylines, seo, taxonomies, references, skipRevision, slug, and `status`,
 * because EmDash treats a status on a PUT as live metadata (`status:
 * "draft"` on a published page unpublishes it).
 */
const MACHINE_PUT_KEYS = new Set(['data', '_rev', 'migrateBlocks', 'replaceBlocks']);
const MACHINE_POST_KEYS = new Set(['data', 'slug', 'status', 'locale']);

async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const declared = Number(request.headers.get('content-length') ?? '0');
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return null;
    const text = await request.clone().text();
    if (text.length > MAX_BODY_BYTES) return null;
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function onlyKeys(body: Record<string, unknown>, allowed: Set<string>): boolean {
  return Object.keys(body).every((key) => allowed.has(key));
}

/**
 * What a machine identity may do (cms-first-013): read content and schema,
 * stage a draft on an existing entry against the revision it read (`_rev`
 * required, so EmDash refuses a stale write with 409; on a published entry
 * EmDash stages the write as the pending draft and live is untouched),
 * create a new entry as a draft, and ask for a preview link. Publish,
 * unpublish, schedule, delete, schema writes, live metadata and every
 * admin route are denied. The request must also carry EmDash's Bearer
 * token, so a service token alone never reaches the admin or an
 * Access-authenticated session.
 */
export async function evaluateMachineRequest(request: Request, pathname: string): Promise<GateDecision> {
  const path = canonicalPathname(pathname);
  const method = request.method.toUpperCase();
  if (!/^bearer\s+\S+/i.test(request.headers.get('authorization') ?? '')) return { allow: false, reason: 'machine-no-bearer' };
  if ((method === 'GET' || method === 'HEAD') && MACHINE_READ.test(path) && !MACHINE_READ_DENIED.test(path)) return { allow: true, reason: 'machine-read' };
  if (method === 'POST' && MACHINE_PREVIEW.test(path)) return { allow: true, reason: 'machine-preview' };
  if (method === 'PUT' && MACHINE_ENTRY.test(path)) {
    const body = await readJsonBody(request);
    const rev = body?._rev;
    if (body && onlyKeys(body, MACHINE_PUT_KEYS) && typeof rev === 'string' && rev.trim()) return { allow: true, reason: 'machine-draft' };
    return { allow: false, reason: 'machine-draft-rules' };
  }
  if (method === 'POST' && MACHINE_COLLECTION.test(path)) {
    const body = await readJsonBody(request);
    if (body && onlyKeys(body, MACHINE_POST_KEYS) && body.status === 'draft') return { allow: true, reason: 'machine-create-draft' };
    return { allow: false, reason: 'machine-draft-rules' };
  }
  return { allow: false, reason: 'machine-forbidden' };
}

export async function evaluateGate(input: GateInput): Promise<GateDecision> {
  const candidates = [input.pathname, requestPathname(input.request)];
  if (!candidates.some(isEmdashNamespace)) return { allow: true, reason: 'public' };
  if (publicMediaRead(input.request.method, candidates)) return { allow: true, reason: 'public-media' };
  if (input.dev) return { allow: true, reason: 'dev' };

  const config = accessConfig(input.env);
  if (!config) return { allow: false, reason: 'access-not-configured' };

  const operator = await evaluateOperator(input, config);
  if (operator.email) return operator.decision;
  if (!input.verifyMachine) return { allow: false, reason: 'no-identity' };
  let machine: MachineIdentity | null | undefined;
  try {
    machine = await input.verifyMachine(input.request, config);
  } catch {
    machine = null;
  }
  const commonName = machine?.commonName?.trim();
  if (!commonName || machine?.email?.trim()) return { allow: false, reason: 'no-identity' };
  return evaluateMachineRequest(input.request, requestPathname(input.request));
}

export function deniedResponse(): Response {
  return new Response('Not Found', {
    status: 404,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}
