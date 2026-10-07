import cloudflare from '@astrojs/cloudflare';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';
import react from '@astrojs/react';
import { access, d1, r2, sandbox } from '@emdash-cms/cloudflare';
import { defineConfig } from 'astro/config';
import emdash from 'emdash/astro';

// Build input only. Unset (the default) leaves the /_emdash namespace denied
// in production; see docs/cms-access.md. Never commit a value.
const teamDomain = process.env.EMDASH_ACCESS_TEAM_DOMAIN ?? '';

// The build's own timestamp: the validator of a seed-rendered page, whose
// content changes only with a deploy (src/page-cache.ts). EmDash folds its
// build date into a page's validator only when the page already carries one.
const buildTime = new Date().toISOString();

export default defineConfig({
  site: 'https://repoglance.com',
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough' }),
  // Route cache with the Cloudflare provider: the public pages opt in from
  // src/page-cache.ts; every other response is no-store at the edge. The
  // adapter turns on Cloudflare's Workers Cache in the generated deploy config.
  cache: { provider: cacheCloudflare() },
  integrations: [
    react(),
    emdash({
      siteUrl: 'https://repoglance.com',
      database: d1({ binding: 'DB', session: 'disabled' }),
      storage: r2({ binding: 'MEDIA' }),
      sandboxRunner: sandbox(),
      ...(teamDomain
        ? { auth: access({ teamDomain, audienceEnvVar: 'CF_ACCESS_AUDIENCE', defaultRole: 40 }) }
        : {}),
      middleware: {
        // www redirect, then the fail-closed /_emdash guard (src/outer-middleware.ts).
        outer: './src/outer-middleware.ts',
      },
    }),
  ],
  vite: {
    define: {
      'import.meta.env.EMDASH_ACCESS_TEAM_DOMAIN': JSON.stringify(teamDomain),
      'import.meta.env.REPOGLANCE_BUILD_TIME': JSON.stringify(buildTime),
    },
  },
  devToolbar: { enabled: false },
});
