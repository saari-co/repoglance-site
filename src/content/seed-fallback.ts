import seed from '../../seed/seed.json';

export interface SeedBlock {
  _type: string;
  _version: number;
  _key: string;
  [field: string]: unknown;
}

export interface PageData {
  title: string;
  description: string;
  layout: SeedBlock[];
}

interface SeedPage {
  slug: string;
  status?: string;
  data: PageData;
}

const pages = (seed as { content: { pages: SeedPage[] } }).content.pages;

/** The page as shipped in seed/seed.json, or null when the slug is unknown. */
export function seedPage(slug: string): PageData | null {
  const page = pages.find((entry) => entry.slug === slug && (entry.status ?? 'published') === 'published');
  return page ? page.data : null;
}

export const seedSlugs = pages.map((page) => page.slug);
