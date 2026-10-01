import { defineMiddleware } from 'astro:middleware';
import { permanentRedirect, redirectTarget } from './host-canonical.ts';

/**
 * Outermost middleware: www.repoglance.com is a pure redirector. It runs
 * before the namespace guard so nothing is ever served from the www host; the
 * guard and the CMS only ever see the apex.
 */
export const onRequest = defineMiddleware((context, next) => {
  const target = redirectTarget(context.request, context.url);
  return target ? permanentRedirect(target) : next();
});
