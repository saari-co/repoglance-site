/**
 * Edge-cache policy for the public pages (decision www-redirect-and-cache-009).
 * Pure: no Astro imports, unit-tested under Node.
 *
 * Astro's route cache with the Cloudflare provider turns these options into
 * `Cloudflare-CDN-Cache-Control` and `Cache-Tag` headers, and the adapter
 * turns on Cloudflare's Workers Cache (`cache.enabled` in the generated deploy
 * config). Only a rendered public page opts in; the /_emdash namespace (EmDash
 * opts out), the 404 page and the www redirect stay no-store by the adapter's
 * default, so the fail-closed guard runs for every namespace request.
 *
 * Invalidation: EmDash purges the entry and collection tags on every admin
 * write (publish, update, unpublish, create, restore, schedule) through the
 * Workers cache purge binding, and the cache is keyed by Worker version so a
 * deploy starts cold. The five-minute TTL is the backstop if a purge fails.
 */
export const PAGES_COLLECTION = 'pages';
/** Fresh window in seconds. */
export const PUBLIC_PAGE_MAX_AGE = 300;
/** Stale-while-revalidate window in seconds after the fresh window. */
export const PUBLIC_PAGE_SWR = 60;
/**
 * The Workers Cache keys by path and query only, not by host, so without the
 * Host variant a cached apex page would answer www requests and skip the
 * redirect. The Cookie variant keeps EmDash's cookie-driven edit mode on fresh
 * renders (EmDash marks those private and no-store); anonymous visitors carry
 * no cookie and share one entry.
 */
export const PUBLIC_PAGE_VARY = 'Host, Cookie';

export interface PageCacheHint {
  tags?: string[];
  lastModified?: Date;
}

export interface PageCacheOptions {
  maxAge: number;
  swr: number;
  tags: string[];
  lastModified?: Date;
}

/** The route-cache options for a rendered page: the collection tag plus EmDash's hint. */
export function publicPageCacheOptions(hint: PageCacheHint | undefined): PageCacheOptions {
  const tags = [...new Set([PAGES_COLLECTION, ...(hint?.tags ?? []).filter((tag) => typeof tag === 'string' && tag.trim())])];
  const options: PageCacheOptions = { maxAge: PUBLIC_PAGE_MAX_AGE, swr: PUBLIC_PAGE_SWR, tags };
  if (hint?.lastModified instanceof Date && !Number.isNaN(hint.lastModified.getTime())) options.lastModified = hint.lastModified;
  return options;
}

export type PageContentSource = 'cms' | 'seed' | 'none';

export interface PageResponseInput {
  /** Whether a page rendered; a missing page answers 404 and stays no-store. */
  found: boolean;
  source: PageContentSource;
  cacheHint?: PageCacheHint;
}

/** The slice of the Astro global a page needs here; structural, so it stays testable. */
export interface PageResponseContext {
  cache: { set(options: PageCacheOptions): void };
  response: { status?: number; headers: Headers };
}

/**
 * Settle the response-level decisions for a public page. Must run from the
 * page frontmatter or middleware: Astro streams HTML, so a component's
 * frontmatter runs after the Response and its headers exist.
 *
 * A rendered page opts into the edge cache with the collection tag plus
 * EmDash's tags, so a publish purges it, and varies by Host and Cookie. The
 * entry's `lastModified` is folded in only for a CMS render: a seed fallback
 * must not inherit the validator of an entry it no longer shows, or a
 * browser's conditional request could keep a retired body. EmDash's
 * middleware still folds the build date in for every on-demand render, and
 * the Cloudflare provider scopes the ETag to the deployed Worker version.
 */
export function applyPageResponse(astro: PageResponseContext, input: PageResponseInput): void {
  if (!input.found) {
    astro.response.status = 404;
    return;
  }
  const hint = input.source === 'cms' ? input.cacheHint : { tags: input.cacheHint?.tags };
  astro.cache.set(publicPageCacheOptions(hint));
  astro.response.headers.set('Vary', PUBLIC_PAGE_VARY);
}
