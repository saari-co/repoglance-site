import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { access, d1, r2, sandbox } from '@emdash-cms/cloudflare';
import { defineConfig } from 'astro/config';
import emdash from 'emdash/astro';

// Build input only. Unset (the default) leaves the /_emdash namespace denied
// in production; see docs/cms-access.md. Never commit a value.
const teamDomain = process.env.EMDASH_ACCESS_TEAM_DOMAIN ?? '';

export default defineConfig({
  site: 'https://repoglance.com',
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough' }),
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
        outer: './src/emdash-namespace-guard.ts',
      },
    }),
  ],
  vite: {
    define: {
      'import.meta.env.EMDASH_ACCESS_TEAM_DOMAIN': JSON.stringify(teamDomain),
    },
  },
  devToolbar: { enabled: false },
});
