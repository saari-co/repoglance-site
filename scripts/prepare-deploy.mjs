import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Builds the production Wrangler config for `wrangler deploy` from the one
 * the Astro adapter emitted at build time, with the production identifiers
 * taken from the environment so they never enter source:
 *
 *   REPOGLANCE_D1_ID        production D1 database id (required)
 *   REPOGLANCE_D1_NAME      production D1 database name (default repoglance-site-cms)
 *   REPOGLANCE_R2_BUCKET    production R2 bucket name (default repoglance-site-media)
 *   REPOGLANCE_CUSTOM_DOMAIN  optional custom domains to attach, comma-separated
 *                            (e.g. repoglance.com,www.repoglance.com)
 *   REPOGLANCE_WORKERS_DEV  "true" to serve on the workers.dev preview hostname
 *   REPOGLANCE_SANDBOX      "false" to drop the Workers Paid worker_loaders binding
 *   REPOGLANCE_MIRROR_EMAIL_TO  optional recipient of the CMS mirror's failure
 *                            emails (a verified Email Routing destination);
 *                            becomes the Worker var MIRROR_EMAIL_TO
 *
 * Output: dist/server/wrangler.production.json (ignored, beside the built
 * config so Wrangler resolves the entry and asset paths). Nothing here deploys.
 */
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const built = JSON.parse(readFileSync(join(root, 'dist/server/wrangler.json'), 'utf8'));
const env = process.env;
const d1Id = env.REPOGLANCE_D1_ID?.trim();
if (!d1Id) {
  console.error('REPOGLANCE_D1_ID is required (the production D1 database id).');
  process.exit(2);
}
const config = {
  ...built,
  workers_dev: env.REPOGLANCE_WORKERS_DEV === 'true',
  preview_urls: false,
  d1_databases: (built.d1_databases ?? []).map((db) =>
    db.binding === 'DB' ? { ...db, database_name: env.REPOGLANCE_D1_NAME?.trim() || 'repoglance-site-cms', database_id: d1Id } : db,
  ),
  r2_buckets: (built.r2_buckets ?? []).map((bucket) =>
    bucket.binding === 'MEDIA' ? { ...bucket, bucket_name: env.REPOGLANCE_R2_BUCKET?.trim() || 'repoglance-site-media' } : bucket,
  ),
};
if (env.REPOGLANCE_SANDBOX === 'false') delete config.worker_loaders;
const mirrorEmailTo = env.REPOGLANCE_MIRROR_EMAIL_TO?.trim();
if (mirrorEmailTo) config.vars = { ...(config.vars ?? {}), MIRROR_EMAIL_TO: mirrorEmailTo };
const domains = (env.REPOGLANCE_CUSTOM_DOMAIN ?? '').split(',').map((d) => d.trim()).filter(Boolean);
if (domains.length) config.routes = domains.map((pattern) => ({ pattern, custom_domain: true }));
else delete config.routes;
mkdirSync(join(root, 'dist/server'), { recursive: true });
const out = join(root, 'dist/server/wrangler.production.json');
writeFileSync(out, `${JSON.stringify(config, null, 2)}\n`);
const summary = {
  name: config.name,
  workers_dev: config.workers_dev,
  routes: config.routes ?? [],
  d1: config.d1_databases.map((db) => `${db.binding}=${db.database_name}`),
  r2: config.r2_buckets.map((b) => `${b.binding}=${b.bucket_name}`),
  worker_loaders: Boolean(config.worker_loaders),
  cache: config.cache ?? null,
  version_metadata: config.version_metadata?.binding ?? null,
  send_email: (config.send_email ?? []).map((binding) => binding.name),
  mirror_email_to: Boolean(mirrorEmailTo),
};
console.log(`Wrote ${out}\n${JSON.stringify(summary, null, 2)}`);
