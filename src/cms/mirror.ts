/**
 * The site mirrors itself into the repository (decision cms-first-013).
 *
 * After an edit is published or unpublished in the EmDash admin, the Worker
 * reads the live pages, rebuilds `seed/seed.json` on top of the
 * repository's `main`, and, through a GitHub fine-grained token that may
 * push a branch and open a pull request and never merges, opens or updates
 * one PR titled "CMS edit: …" labelled `cms-edit`. The repository's own
 * workflow arms auto-merge and GitHub merges it when the checks are green;
 * a published edit that fails a truth test leaves the PR open and red.
 *
 * Any failure sends an email naming the page, the error and the manual
 * re-run (`npm run cms:mirror`); when the token or the email channel is not
 * configured yet the module logs that it is unconfigured and does nothing
 * else. Pure: `fetch`, the page reader, the email sender and the clock are
 * injected, so the unit tests run it under Node.
 */
import { mirrorPages, pageDifferences, serializeSeed, type LivePage, type SeedFile } from '../content/cms-shape.ts';

export interface MirrorEnv {
  GITHUB_MIRROR_TOKEN?: string;
  GITHUB_MIRROR_REPO?: string;
  GITHUB_API_BASE?: string;
  GITHUB_MIRROR_BASE_BRANCH?: string;
  MIRROR_EMAIL_TO?: string;
  MIRROR_EMAIL_FROM?: string;
}

export interface MirrorTrigger {
  collection: string;
  id: string;
  /** The entry's slug when the trigger could read it from the response; the id otherwise. */
  slug?: string;
  action: 'publish' | 'unpublish' | 'manual';
  /** The editor's display name, never an address. */
  editor?: string;
}

export interface MirrorEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
}

export interface MirrorDeps {
  env: MirrorEnv;
  fetch: typeof fetch;
  /** The pages that are live in the CMS right now. */
  readLivePages: () => Promise<LivePage[]>;
  /** Sends one email through the configured channel; absent when none is configured. */
  sendEmail?: (message: MirrorEmail) => Promise<void>;
  log?: (line: string) => void;
  now?: () => Date;
}

export type MirrorOutcome =
  | { status: 'unconfigured'; detail: string }
  | { status: 'equal'; detail: string }
  | { status: 'opened' | 'updated'; detail: string; prUrl: string; branch: string }
  | { status: 'failed'; detail: string; emailed: boolean };

export const SEED_PATH = 'seed/seed.json';
export const BRANCH_PREFIX = 'cms-edit/';
export const LABEL = 'cms-edit';
export const DEFAULT_EMAIL_FROM = 'mirror@repoglance.com';
export const RERUN_INSTRUCTIONS =
  'To mirror by hand, from a checkout of main on a machine with cloudflared:\n' +
  '  cloudflared access login https://repoglance.com/_emdash\n' +
  '  npm run cms:mirror\n' +
  'It writes the live CMS pages into seed/seed.json and opens the cms-edit PR (docs/cms-access.md).';

class GitHubError extends Error {
  readonly method: string;
  readonly path: string;
  readonly status: number;
  constructor(method: string, path: string, status: number, detail: string) {
    super(`GitHub ${method} ${path} answered ${status}: ${detail}`);
    this.name = 'GitHubError';
    this.method = method;
    this.path = path;
    this.status = status;
  }
}

/** Decode the base64 (with GitHub's line breaks) of the contents API into text. */
export function decodeContent(base64: string): string {
  const binary = atob(base64.replace(/\s+/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function timestamp(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/[:]/g, '').replace('T', '-').replace('Z', 'z');
}

export interface GitHubClient {
  request<T = unknown>(method: string, path: string, body?: unknown): Promise<T>;
}

export function githubClient(fetchImpl: typeof fetch, apiBase: string, token: string): GitHubClient {
  const base = apiBase.replace(/\/+$/, '');
  return {
    async request<T>(method: string, path: string, body?: unknown): Promise<T> {
      const response = await fetchImpl(`${base}${path}`, {
        method,
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${token}`,
          'x-github-api-version': '2022-11-28',
          'user-agent': 'repoglance-site-cms-mirror',
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const text = await response.text();
      if (!response.ok) {
        let detail = text.slice(0, 300);
        try {
          const json = JSON.parse(text) as { message?: string };
          if (json.message) detail = json.message;
        } catch {
          // keep the raw text
        }
        throw new GitHubError(method, path, response.status, detail);
      }
      return (text ? JSON.parse(text) : undefined) as T;
    },
  };
}

interface PullRequest {
  number: number;
  html_url: string;
  head: { ref: string; sha: string; repo?: { full_name?: string } | null };
}

/** The PR title and body for a mirror of `live` on top of `baseSeed`. */
export function describeChange(baseSeed: SeedFile, live: LivePage[], trigger: MirrorTrigger, at: Date): { title: string; body: string; message: string; slugs: string[] } {
  const differences = pageDifferences(baseSeed, live);
  const slugs = [...new Set(differences.map((difference) => difference.slug))];
  const subject = slugs.length ? slugs.join(', ') : (trigger.slug ?? trigger.id);
  const day = at.toISOString().slice(0, 10);
  const who = trigger.editor ? ` by ${trigger.editor}` : '';
  const title = `CMS edit: ${subject} (${trigger.action === 'manual' ? 'mirrored by hand' : trigger.action}${who}, ${day})`;
  const lines = [
    trigger.action === 'manual'
      ? `Mirrored by \`npm run cms:mirror\`${who} on ${at.toISOString()}.`
      : `An edit was ${trigger.action === 'publish' ? 'published' : 'unpublished'} in the EmDash admin${who} on ${at.toISOString()} (page \`${trigger.slug ?? trigger.id}\`).`,
    '',
    'This PR mirrors the live CMS pages into `seed/seed.json`, opened by the site itself (decision `cms-first-013`, `src/cms/mirror.ts`). The CMS owns content; the repository keeps this record and the fallback.',
    '',
    '## What changed',
    '',
    ...(differences.length ? differences.map((difference) => `- \`${difference.slug}\`: ${difference.kind === 'content' ? `content (${difference.detail})` : difference.detail}`) : ['- No difference against `main` at the time of the mirror (a previous mirror already carried this edit).']),
    '',
    '## What happens next',
    '',
    'The truth tests run on this PR. The `CMS edit auto-merge` workflow arms auto-merge and GitHub merges when the checks are green. If a check fails, the published edit is already live: fix the wording in the admin (the next publish updates this PR) or change the rule in this PR.',
  ];
  return { title, body: lines.join('\n'), message: `${title}\n\nMirror of the live EmDash content into seed/seed.json (cms-first-013).`, slugs };
}

async function commitSeed(gh: GitHubClient, repo: string, parentSha: string, text: string, message: string): Promise<string> {
  const parent = await gh.request<{ tree: { sha: string } }>('GET', `/repos/${repo}/git/commits/${parentSha}`);
  const blob = await gh.request<{ sha: string }>('POST', `/repos/${repo}/git/blobs`, { content: text, encoding: 'utf-8' });
  const tree = await gh.request<{ sha: string }>('POST', `/repos/${repo}/git/trees`, {
    base_tree: parent.tree.sha,
    tree: [{ path: SEED_PATH, mode: '100644', type: 'blob', sha: blob.sha }],
  });
  const commit = await gh.request<{ sha: string }>('POST', `/repos/${repo}/git/commits`, { message, tree: tree.sha, parents: [parentSha] });
  return commit.sha;
}

/** Run the mirror once for a publish or unpublish. Never throws: every failure becomes an outcome and an email. */
export async function runMirror(trigger: MirrorTrigger, deps: MirrorDeps): Promise<MirrorOutcome> {
  const log = deps.log ?? ((line: string) => console.log(line));
  const now = deps.now ?? (() => new Date());
  const { env } = deps;
  const token = env.GITHUB_MIRROR_TOKEN?.trim();
  const repo = env.GITHUB_MIRROR_REPO?.trim();
  if (!token || !repo) {
    const detail = `mirror not configured (${!token ? 'GITHUB_MIRROR_TOKEN' : 'GITHUB_MIRROR_REPO'} missing): ${trigger.action} of ${trigger.collection}/${trigger.slug ?? trigger.id} was not mirrored; run npm run cms:mirror by hand`;
    log(`[cms-mirror] ${detail}`);
    return { status: 'unconfigured', detail };
  }
  const baseBranch = env.GITHUB_MIRROR_BASE_BRANCH?.trim() || 'main';
  const gh = githubClient(deps.fetch, env.GITHUB_API_BASE?.trim() || 'https://api.github.com', token);
  try {
    const live = await deps.readLivePages();
    const ref = await gh.request<{ object: { sha: string } }>('GET', `/repos/${repo}/git/ref/heads/${baseBranch}`);
    const baseSha = ref.object.sha;
    const file = await gh.request<{ content: string; encoding: string }>('GET', `/repos/${repo}/contents/${SEED_PATH}?ref=${baseSha}`);
    if (file.encoding !== 'base64') throw new Error(`unexpected encoding ${file.encoding} for ${SEED_PATH}`);
    const baseText = decodeContent(file.content);
    const baseSeed = JSON.parse(baseText) as SeedFile;
    const mirrored = serializeSeed(mirrorPages(baseSeed, live));
    if (mirrored === baseText) {
      const detail = `${baseBranch} already equals the live CMS after ${trigger.action} of ${trigger.slug ?? trigger.id}`;
      log(`[cms-mirror] ${detail}`);
      return { status: 'equal', detail };
    }
    const at = now();
    const change = describeChange(baseSeed, live, trigger, at);
    const open = await gh.request<PullRequest[]>('GET', `/repos/${repo}/pulls?state=open&base=${encodeURIComponent(baseBranch)}&per_page=50`);
    const existing = open.find((pr) => pr.head.ref.startsWith(BRANCH_PREFIX) && (pr.head.repo?.full_name ?? repo) === repo);
    if (existing) {
      const sha = await commitSeed(gh, repo, existing.head.sha, mirrored, change.message);
      await gh.request('PATCH', `/repos/${repo}/git/refs/heads/${existing.head.ref}`, { sha, force: false });
      await gh.request('PATCH', `/repos/${repo}/pulls/${existing.number}`, { title: change.title, body: change.body });
      const detail = `updated ${existing.html_url} (${existing.head.ref}) with ${change.slugs.join(', ') || trigger.slug || trigger.id}`;
      log(`[cms-mirror] ${detail}`);
      return { status: 'updated', detail, prUrl: existing.html_url, branch: existing.head.ref };
    }
    const branch = `${BRANCH_PREFIX}${timestamp(at)}`;
    const sha = await commitSeed(gh, repo, baseSha, mirrored, change.message);
    await gh.request('POST', `/repos/${repo}/git/refs`, { ref: `refs/heads/${branch}`, sha });
    const pr = await gh.request<PullRequest>('POST', `/repos/${repo}/pulls`, { title: change.title, head: branch, base: baseBranch, body: change.body });
    await gh.request('POST', `/repos/${repo}/issues/${pr.number}/labels`, { labels: [LABEL] });
    const detail = `opened ${pr.html_url} (${branch}) with ${change.slugs.join(', ') || trigger.slug || trigger.id}`;
    log(`[cms-mirror] ${detail}`);
    return { status: 'opened', detail, prUrl: pr.html_url, branch };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const detail = `mirror failed after ${trigger.action} of ${trigger.collection}/${trigger.slug ?? trigger.id}: ${message}`;
    log(`[cms-mirror] ${detail}`);
    const emailed = await notifyFailure(trigger, message, deps, log);
    return { status: 'failed', detail, emailed };
  }
}

/** The failure email; returns whether it was sent. Never throws. */
export async function notifyFailure(trigger: MirrorTrigger, message: string, deps: MirrorDeps, log: (line: string) => void): Promise<boolean> {
  const to = deps.env.MIRROR_EMAIL_TO?.trim();
  if (!deps.sendEmail || !to) {
    log(`[cms-mirror] no email channel is configured (${!deps.sendEmail ? 'send_email binding' : 'MIRROR_EMAIL_TO'} missing); the failure above is only in this log`);
    return false;
  }
  const email: MirrorEmail = {
    from: deps.env.MIRROR_EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM,
    to,
    subject: `repoglance.com: CMS mirror failed for ${trigger.slug ?? trigger.id} (${trigger.action})`,
    text: [
      `The site could not mirror a CMS edit into the repository.`,
      '',
      `Page: ${trigger.collection}/${trigger.slug ?? trigger.id}${trigger.slug ? ` (id ${trigger.id})` : ''}`,
      `Action: ${trigger.action}${trigger.editor ? ` by ${trigger.editor}` : ''}`,
      `When: ${(deps.now ?? (() => new Date()))().toISOString()}`,
      `Error: ${message}`,
      '',
      'The published edit is live. The repository (seed/seed.json) is behind it until the mirror runs.',
      '',
      RERUN_INSTRUCTIONS,
    ].join('\n'),
  };
  try {
    await deps.sendEmail(email);
    log(`[cms-mirror] failure email sent to the configured recipient`);
    return true;
  } catch (error) {
    log(`[cms-mirror] the failure email could not be sent: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}
