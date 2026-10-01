/**
 * The only images the site shows: sample-mode captures from the Play listing
 * release repoglance-play-listing-20260930-040 (docs/content.md). Every file
 * is 9:16; the 540 and 1080 widths serve a srcset.
 */
export const screenshots = {
  'home-widgets': {
    alt: 'A Pixel home screen with the RepoGlance Pinned repos widget listing two sample repositories and a tall Repository widget, every time slot reading sample',
  },
  'catalog-pinned': {
    alt: 'The RepoGlance catalog in sample mode: a SAMPLE banner, then pinned repositories sorted first with their open issue and pull request counts',
  },
  'repository-issues-and-prs': {
    alt: 'A sample repository in RepoGlance showing its open issues and pull requests in one list',
  },
  'repository-prs': {
    alt: 'A sample repository in RepoGlance filtered to open pull requests, one of them marked Draft',
  },
  'owner-filter': {
    alt: 'The owner filter menu open over the sample catalog, listing the sample account and organizations',
  },
  'connect-or-explore-sample': {
    alt: 'The first RepoGlance screen with Sign in with GitHub and Explore with sample data',
  },
  'quick-settings-tile': {
    alt: 'The Quick Settings panel with the RepoGlance tile reading Sample data, a repository name and an age',
  },
} as const;

export type ScreenshotSlug = keyof typeof screenshots;

export function isScreenshotSlug(value: unknown): value is ScreenshotSlug {
  return typeof value === 'string' && value in screenshots;
}
