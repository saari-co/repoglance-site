/**
 * The site's images live in EmDash's Media Library (decision
 * media-library-014). This module is the pure part of that: the shapes an
 * image field can carry, how each resolves to something the page can render,
 * and the naming that ties a library item back to an approved capture. No
 * Astro, no Node, no network: the components, the scripts and the unit
 * tests all import it.
 *
 * Two shapes reach the renderer:
 *
 * - A media value, as EmDash stores it after the editor picks an image in
 *   the admin or after setup sideloads a `$media` reference: `{ id, alt,
 *   width, height, filename, meta: { storageKey }, darkVariant }`. The file
 *   is served by the public media route `/_emdash/api/media/file/<key>`.
 * - A seed reference, as `seed/seed.json` declares it so a fresh site
 *   sideloads the capture at bootstrap: `{ "$media": { url, alt },
 *   darkVariant: { "$media": {...} } }`. The seed fallback renders the same
 *   file from the repository's own copy under `public/screenshots/`.
 *
 * Both go through Astro's image endpoint, which serves the widths from the
 * one source per capture (the hand-cut 540 and 1080 px files retired).
 * EmDash 1.2.0's seed resolver stores the primary of a `$media` reference
 * and drops a nested `darkVariant`; `npm run cms:media -- --apply`
 * completes the pairing from the library (docs/cms-access.md).
 */

/** Where a brand-new site downloads the approved captures from at bootstrap: the repository's own files on `main`. */
export const SEED_MEDIA_BASE = 'https://raw.githubusercontent.com/saari-co/repoglance-site/main/public/screenshots';
/** The repository's copy of the approved captures, served as static assets; the seed fallback renders these. */
export const CAPTURES_PATH = '/screenshots';
/** EmDash's public media-file route. */
export const MEDIA_FILE_ROUTE = '/_emdash/api/media/file/';
/** The widths the image endpoint serves for every slot (the sizes attribute asks for 320 px at most on wide viewports). */
export const RENDER_WIDTHS = [540, 1080] as const;
export const RENDER_FORMAT = 'webp';
export const RENDER_SIZES = '(min-width: 760px) 320px, 70vw';
/** A storage key the public media route may serve: the flat `{ulid}{ext}` shape EmDash's upload pipeline produces. */
export const SAFE_STORAGE_KEY = /^[A-Za-z0-9._-]+$/;

export interface SeedMediaRef {
  $media: { url: string; alt?: string; filename?: string; caption?: string };
}

export interface SeedImageValue extends SeedMediaRef {
  darkVariant?: SeedMediaRef;
}

export interface MediaValue {
  id?: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  filename?: string;
  mimeType?: string;
  provider?: string;
  meta?: { storageKey?: unknown; [key: string]: unknown };
  darkVariant?: MediaValue | SeedMediaRef | null;
  [key: string]: unknown;
}

/** One approved capture as `seed/media.json` records it: the repository's file and its facts. */
export interface ApprovedCapture {
  file: string;
  capture: string;
  scheme: 'light' | 'dark';
  width: number;
  height: number;
  size: number;
  sha256: string;
  /** EmDash's content hash of the same bytes (`sha1:<hex>`), the key the library is matched on. */
  contentHash: string;
  alt: string;
}

/** One library item as the mirror records it from the CMS. */
export interface LibraryItem {
  id: string;
  filename: string;
  mimeType: string;
  size: number | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  contentHash: string | null;
  storageKey: string;
  status: string;
}

export interface MediaUsage {
  page: string;
  block: string;
  type: string;
  field: string;
  image: { id: string; filename: string | null } | null;
  darkVariant: { id: string; filename: string | null } | null;
}

/** `seed/media.json`: the repository's approved captures and the mirror's record of the live library. */
export interface MediaManifest {
  base: string;
  approved: ApprovedCapture[];
  library: LibraryItem[];
  usage: MediaUsage[];
  [key: string]: unknown;
}

export interface RenderableImage {
  /** The source the image endpoint reads: a repository capture path or a media-file route. */
  href: string;
  alt: string;
  width?: number;
  height?: number;
  /** The capture's name (`home-widgets` for `home-widgets-light.webp`), the hook for the per-subject card rules. */
  name: string;
  kind: 'seed' | 'media';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isSeedMediaRef(value: unknown): value is SeedMediaRef {
  if (!isRecord(value) || !isRecord(value.$media)) return false;
  return typeof value.$media.url === 'string' && value.$media.url.trim() !== '';
}

/** The file a seed reference names: the last path segment of its URL. */
export function seedRefFile(ref: SeedMediaRef): string {
  const url = ref.$media.url.trim();
  const path = url.split(/[?#]/)[0];
  const file = path.slice(path.lastIndexOf('/') + 1);
  try {
    return decodeURIComponent(file);
  } catch {
    return file;
  }
}

/** The capture a file belongs to: `home-widgets` for `home-widgets-light.webp` and `home-widgets-dark.webp`. */
export function captureName(filename: string): string {
  const stem = filename.replace(/\.[a-z0-9]+$/i, '');
  return stem.replace(/-(light|dark)$/, '');
}

/** Which scheme's cut a file is, by the naming the approved captures use. */
export function captureScheme(filename: string): 'light' | 'dark' | null {
  const match = filename.replace(/\.[a-z0-9]+$/i, '').match(/-(light|dark)$/);
  return match ? (match[1] as 'light' | 'dark') : null;
}

/** The storage key a media value is served from, or null when it carries none this site can serve. */
export function storageKeyOf(value: MediaValue): string | null {
  const key = value.meta?.storageKey;
  if (typeof key === 'string' && SAFE_STORAGE_KEY.test(key)) return key;
  if (typeof value.src === 'string' && value.src.startsWith(MEDIA_FILE_ROUTE)) {
    const fromSrc = value.src.slice(MEDIA_FILE_ROUTE.length);
    if (SAFE_STORAGE_KEY.test(fromSrc)) return fromSrc;
  }
  return null;
}

function dimension(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : undefined;
}

/**
 * Resolve one media item (a seed reference or a stored media value) to what
 * the page renders. `approved` supplies the dimensions of a seed reference,
 * which carries none of its own. Anything else (an external URL, a value
 * without a storage key) renders nothing.
 */
export function resolveMediaSource(value: unknown, approved: ReadonlyMap<string, ApprovedCapture> = new Map()): RenderableImage | null {
  if (isSeedMediaRef(value)) {
    const file = seedRefFile(value);
    if (!file) return null;
    const capture = approved.get(file);
    return {
      href: `${CAPTURES_PATH}/${encodeURIComponent(file)}`,
      alt: typeof value.$media.alt === 'string' ? value.$media.alt : '',
      width: capture?.width,
      height: capture?.height,
      name: captureName(file),
      kind: 'seed',
    };
  }
  if (!isRecord(value)) return null;
  const media = value as MediaValue;
  if (media.provider && media.provider !== 'local') return null;
  const key = storageKeyOf(media);
  if (!key) return null;
  const filename = typeof media.filename === 'string' && media.filename ? media.filename : key;
  return {
    href: `${MEDIA_FILE_ROUTE}${key}`,
    alt: typeof media.alt === 'string' ? media.alt : '',
    width: dimension(media.width),
    height: dimension(media.height),
    name: captureName(filename),
    kind: 'media',
  };
}

export interface ResolvedImage {
  primary: RenderableImage | null;
  dark: RenderableImage | null;
}

/** An image field's value as the page renders it: the primary and, when the value carries one, the dark variant. */
export function resolveImageValue(value: unknown, approved?: ReadonlyMap<string, ApprovedCapture>): ResolvedImage {
  const primary = resolveMediaSource(value, approved);
  if (!primary) return { primary: null, dark: null };
  const dark = isRecord(value) ? resolveMediaSource(value.darkVariant, approved) : null;
  return { primary, dark };
}

/** The URL of one rendition through Astro's image endpoint (`route` is the endpoint's route, `/_image` by default). */
export function imageEndpointUrl(route: string, href: string, width: number, format: string = RENDER_FORMAT): string {
  const params = new URLSearchParams();
  params.set('href', href);
  params.set('w', String(width));
  params.set('f', format);
  return `${route}?${params.toString()}`;
}

/** The srcset of one source: every render width through the endpoint. */
export function imageSrcset(route: string, href: string): string {
  return RENDER_WIDTHS.map((width) => `${imageEndpointUrl(route, href, width)} ${width}w`).join(', ');
}

/** The approved captures by file name. */
export function approvedByFile(manifest: Pick<MediaManifest, 'approved'> | undefined): Map<string, ApprovedCapture> {
  return new Map((manifest?.approved ?? []).map((capture) => [capture.file, capture]));
}

/** Whether a canonical pathname is the public media-file route with a key the route may serve. */
export function publicMediaKey(pathname: string): string | null {
  if (!pathname.startsWith(MEDIA_FILE_ROUTE)) return null;
  const key = pathname.slice(MEDIA_FILE_ROUTE.length);
  return SAFE_STORAGE_KEY.test(key) && !/^\.+$/.test(key) ? key : null;
}
