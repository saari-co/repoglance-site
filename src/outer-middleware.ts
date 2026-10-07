import { sequence } from 'astro:middleware';
import { onRequest as cmsMirror } from './cms/mirror-trigger.ts';
import { onRequest as namespaceGuard } from './emdash-namespace-guard.ts';
import { onRequest as wwwRedirect } from './www-redirect.ts';

/**
 * EmDash's `middleware.outer` entrypoint (astro.config.mjs). Order matters:
 * the www redirect first, then the fail-closed /_emdash guard, then the CMS
 * mirror trigger (which only watches the response of a publish or unpublish
 * that the guard and EmDash already admitted), then EmDash's own middleware
 * and the routes. Edge caching is not a middleware: the public pages opt in
 * through Astro's route cache (src/page-cache.ts) and everything else stays
 * no-store.
 */
export const onRequest = sequence(wwwRedirect, namespaceGuard, cmsMirror);
