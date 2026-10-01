/**
 * The only images the site shows: RepoGlance's showcase captures (GrillTrack
 * site-imagery-007; the app's showcase-048): sample mode rendered without
 * its marker under fictional owners on the approved emulator, so no screen
 * shows a real account and no screen says sample. The sign-in code is a
 * fixture. docs/content.md names the source release and hashes. Each slug
 * ships at 540 and 1080 px wide; the dimensions are the 540 px file's.
 */
export const screenshots = {
  'home-widgets': {
    width: 540,
    height: 960,
    alt: 'A Pixel home screen with the RepoGlance Pinned repos widget listing three made-up repositories and the compact Repository widget below it, each row with the time of its data and its open issue and pull request counts',
  },
  'catalog-pinned': {
    width: 540,
    height: 960,
    alt: 'The RepoGlance catalog: made-up repositories under fictional owners, pinned ones first, with the account filter, search and sort',
  },
  'repository-issues-and-prs': {
    width: 540,
    height: 960,
    alt: 'A made-up repository in RepoGlance showing its open issues and pull requests in one list, with authors, labels and ages',
  },
  'repository-prs': {
    width: 540,
    height: 960,
    alt: 'A made-up repository in RepoGlance filtered to open pull requests, one of them marked Draft',
  },
  'quick-settings-tile': {
    width: 540,
    height: 960,
    alt: 'The Quick Settings panel with the RepoGlance tile reading the latest push to a made-up repository',
  },
  'connect-or-explore-sample': {
    width: 540,
    height: 960,
    alt: 'The first RepoGlance screen with Sign in with GitHub and Explore with sample data',
  },
  'widgets-cutout': {
    width: 540,
    height: 981,
    alt: 'The RepoGlance Pinned repos widget listing three made-up repositories with their open issue and pull request counts, and the compact Repository widget below it, cut from a Pixel home screen',
  },
  'pinned-widget': {
    width: 540,
    height: 787,
    alt: 'The RepoGlance Pinned repos widget: three made-up repositories, each with the time of its data and its open issue and pull request counts',
  },
  'repository-widget': {
    width: 540,
    height: 304,
    alt: 'The compact RepoGlance Repository widget for a made-up repository: the time of its data, open issues 5, pull requests 3',
  },
  'catalog-rows': {
    width: 540,
    height: 540,
    alt: 'Rows of the RepoGlance catalog: made-up repositories with their visibility and last push, pinned ones first',
  },
  'repository-rows': {
    width: 540,
    height: 540,
    alt: 'Open issues of a made-up repository in RepoGlance, each with its number, title, author, comment count and age',
  },
  'tile-row': {
    width: 540,
    height: 420,
    alt: 'The Quick Settings row with the RepoGlance tile showing the latest push to a made-up repository, beside the Internet tile',
  },
  'signin-code': {
    width: 540,
    height: 960,
    alt: 'The RepoGlance sign-in screen: a short code to enter on GitHub, how long it lasts, and the Copy code & open GitHub button; the code shown is made up',
  },
} as const;

export type ScreenshotSlug = keyof typeof screenshots;

export function isScreenshotSlug(value: unknown): value is ScreenshotSlug {
  return typeof value === 'string' && value in screenshots;
}
