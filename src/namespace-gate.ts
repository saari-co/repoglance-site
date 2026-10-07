/**
 * Pure decision logic for the /_emdash namespace. No Astro imports, so the
 * unit tests run it directly.
 */
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
/** What a draft write may carry: the content and the revision it builds on. Everything else (overrideLock, publishedAt, authorId, bylines, seo, taxonomies, references, skipRevision, slug) is a human's call. */
const MACHINE_PUT_KEYS = new Set(['data', '_rev', 'status', 'migrateBlocks', 'replaceBlocks']);
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
 * required, so EmDash refuses a stale write with 409), create a new entry
 * as a draft, and ask for a preview link. Publish, unpublish, schedule,
 * delete, schema writes and every admin route are denied. The request must
 * also carry EmDash's Bearer token, so a service token alone never reaches
 * the admin or an Access-authenticated session.
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
    const status = body?.status;
    if (body && onlyKeys(body, MACHINE_PUT_KEYS) && typeof rev === 'string' && rev.trim() && (status === undefined || status === 'draft')) return { allow: true, reason: 'machine-draft' };
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
  if (input.dev) return { allow: true, reason: 'dev' };

  const teamDomain = input.env[TEAM_DOMAIN_ENV]?.trim();
  const audience = input.env[AUDIENCE_ENV]?.trim();
  if (!teamDomain || !audience) return { allow: false, reason: 'access-not-configured' };

  const config = { teamDomain, audienceEnvVar: AUDIENCE_ENV };
  let identity: GateIdentity | null | undefined;
  try {
    identity = await input.authenticate(input.request, config);
  } catch {
    identity = null;
  }
  const email = identity?.email?.trim().toLowerCase();
  if (!email) {
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

  const allowlist = parseAllowlist(input.env[ALLOWLIST_ENV]);
  if (allowlist.length > 0 && !allowlist.includes(email)) return { allow: false, reason: 'not-on-allowlist' };
  return { allow: true, reason: 'operator' };
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
