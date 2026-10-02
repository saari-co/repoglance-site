/**
 * Pure host logic for the www redirect (decision www-redirect-and-cache-009).
 * No Astro imports, so the unit tests run it directly under Node.
 *
 * Every request that arrives for www.repoglance.com answers a permanent
 * redirect to the same path and query on the apex. Cloudflare Access covers
 * /_emdash on both hosts, so the namespace is redirected like any other path
 * and the editor continues on the apex. Any other host (the apex, local
 * workerd, a preview) is left alone: the redirect never rewrites to a host it
 * did not recognise, and the target origin is a constant.
 */
export const CANONICAL_ORIGIN = 'https://repoglance.com';
export const REDIRECTED_HOSTS: ReadonlySet<string> = new Set(['www.repoglance.com']);

/** Lower-case, without a port or a trailing dot; empty for anything unusable. */
export function normaliseHost(value: string | null | undefined): string {
  if (typeof value !== 'string') return '';
  const host = value.trim().toLowerCase();
  if (!host || host.startsWith('[')) return '';
  const bare = host.replace(/:\d*$/, '');
  return bare.replace(/\.$/, '');
}

export function isRedirectedHost(value: string | null | undefined): boolean {
  return REDIRECTED_HOSTS.has(normaliseHost(value));
}

/** The apex URL for a request path and query. The fragment never reaches the server. */
export function canonicalLocation(url: URL): string {
  return `${CANONICAL_ORIGIN}${url.pathname}${url.search}`;
}

/**
 * The redirect target for a request, or null when the request already uses
 * the apex or any other host. The Host header is checked first because it is
 * what the edge routed on; the parsed URL is a fallback for runtimes that
 * rebuild the URL from it.
 */
export function redirectTarget(request: Request, url: URL = new URL(request.url)): string | null {
  const header = request.headers.get('host');
  if (!isRedirectedHost(header) && !isRedirectedHost(url.host)) return null;
  return canonicalLocation(url);
}

/** A bodiless 301. The edge never stores it: the adapter marks it no-store. */
export function permanentRedirect(location: string): Response {
  return new Response(null, { status: 301, headers: { location } });
}
