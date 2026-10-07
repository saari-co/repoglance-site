import { getEmDashEntry } from 'emdash';
import { applyPageResponse, type PageCacheHint, type PageContentSource, type PageResponseContext } from '../page-cache.ts';
import { seedPage, type PageData } from './seed-fallback';

export type ContentSource = PageContentSource;

export interface LoadedPage {
  page: PageData | null;
  source: ContentSource;
  cacheHint?: PageCacheHint;
}

/**
 * The CMS entry wins when it exists; the seed is the shipped fallback so the
 * public pages never depend on CMS setup (docs/cms-access.md).
 */
export async function loadPage(slug: string): Promise<LoadedPage> {
  let page: PageData | null = null;
  let source: ContentSource = 'none';
  let cacheHint: PageCacheHint | undefined;
  try {
    const { entry, error, cacheHint: hint } = await getEmDashEntry('pages', slug);
    cacheHint = hint;
    const data = entry?.data as Partial<PageData> | undefined;
    if (!error && data && typeof data.title === 'string' && Array.isArray(data.layout)) {
      page = { title: data.title, description: typeof data.description === 'string' ? data.description : '', layout: data.layout };
      source = 'cms';
    }
  } catch {
    page = null;
  }
  if (!page) {
    page = seedPage(slug);
    if (page) source = 'seed';
  }
  return { page, source, cacheHint };
}

/**
 * Load a page and settle the response-level decisions (status, edge-cache
 * options, Vary) in the page frontmatter, which runs before Astro creates the
 * streamed Response; see `applyPageResponse` in src/page-cache.ts.
 */
export async function preparePage(astro: PageResponseContext, slug: string): Promise<LoadedPage> {
  const loaded = await loadPage(slug);
  applyPageResponse(astro, { found: loaded.page !== null, source: loaded.source, cacheHint: loaded.cacheHint, buildTime: buildTime() });
  return loaded;
}

/** The build's timestamp, defined in astro.config.mjs; undefined when it is not a date. */
function buildTime(): Date | undefined {
  const raw = import.meta.env.REPOGLANCE_BUILD_TIME;
  if (typeof raw !== 'string') return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
