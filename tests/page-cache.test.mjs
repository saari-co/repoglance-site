import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MEDIA_TAG, MEDIA_VARY, PAGES_COLLECTION, PUBLIC_PAGE_MAX_AGE, PUBLIC_PAGE_SWR, PUBLIC_PAGE_VARY, applyMediaResponse, applyPageResponse, mediaCacheOptions, publicPageCacheOptions } from '../src/page-cache.ts';

function fakeContext() {
  const calls = [];
  return {
    calls,
    cache: { set: (options) => calls.push(options) },
    response: { status: undefined, headers: new Headers() },
  };
}

test('the policy is five minutes fresh, one minute stale-while-revalidate, varied by host and cookie', () => {
  assert.equal(PUBLIC_PAGE_MAX_AGE, 300);
  assert.equal(PUBLIC_PAGE_SWR, 60);
  assert.equal(PUBLIC_PAGE_VARY, 'Host, Cookie');
  assert.equal(PAGES_COLLECTION, 'pages');
});

test('the options always carry the collection tag so any CMS write to pages purges the page', () => {
  assert.deepEqual(publicPageCacheOptions(undefined), { maxAge: 300, swr: 60, tags: ['pages'] });
  assert.deepEqual(publicPageCacheOptions({}), { maxAge: 300, swr: 60, tags: ['pages'] });
});

test("EmDash's hint tags and lastModified are folded in without duplicates", () => {
  const lastModified = new Date('2026-10-01T12:00:00Z');
  const options = publicPageCacheOptions({ tags: ['pages', 'abc123', ' ', ''], lastModified });
  assert.deepEqual(options, { maxAge: 300, swr: 60, tags: ['pages', 'abc123'], lastModified });
  assert.equal(options.lastModified, lastModified);
});

test('an invalid lastModified is dropped rather than sent as a validator', () => {
  const options = publicPageCacheOptions({ lastModified: new Date('not a date') });
  assert.deepEqual(options, { maxAge: 300, swr: 60, tags: ['pages'] });
  assert.deepEqual(publicPageCacheOptions({}, new Date('also not a date')), { maxAge: 300, swr: 60, tags: ['pages'] });
});

test('the build time is the validator when the hint carries none, and never overrides the hint', () => {
  const buildTime = new Date('2026-10-07T08:00:00Z');
  const entryTime = new Date('2026-10-01T12:00:00Z');
  assert.deepEqual(publicPageCacheOptions({ tags: ['pages'] }, buildTime), { maxAge: 300, swr: 60, tags: ['pages'], lastModified: buildTime });
  assert.deepEqual(publicPageCacheOptions({ tags: ['pages'], lastModified: entryTime }, buildTime), { maxAge: 300, swr: 60, tags: ['pages'], lastModified: entryTime });
});

test('a CMS render opts in with its tags and validator and varies by host and cookie', () => {
  const lastModified = new Date('2026-10-01T12:00:00Z');
  const context = fakeContext();
  applyPageResponse(context, { found: true, source: 'cms', cacheHint: { tags: ['pages', 'entry-1'], lastModified } });
  assert.deepEqual(context.calls, [{ maxAge: 300, swr: 60, tags: ['pages', 'entry-1'], lastModified }]);
  assert.equal(context.response.headers.get('vary'), 'Host, Cookie');
  assert.equal(context.response.status, undefined);
});

test('a seed render keeps the purge tags, never inherits the retired entry validator, and carries the build time instead', () => {
  const buildTime = new Date('2026-10-07T08:00:00Z');
  const context = fakeContext();
  applyPageResponse(context, { found: true, source: 'seed', cacheHint: { tags: ['pages', 'entry-1'], lastModified: new Date('2026-10-01T12:00:00Z') }, buildTime });
  assert.deepEqual(context.calls, [{ maxAge: 300, swr: 60, tags: ['pages', 'entry-1'], lastModified: buildTime }]);
  assert.equal(context.response.headers.get('vary'), 'Host, Cookie');
  const bare = fakeContext();
  applyPageResponse(bare, { found: true, source: 'seed' });
  assert.deepEqual(bare.calls, [{ maxAge: 300, swr: 60, tags: ['pages'] }]);
});

test('a CMS render whose hint carries no validator falls back to the build time', () => {
  const buildTime = new Date('2026-10-07T08:00:00Z');
  const context = fakeContext();
  applyPageResponse(context, { found: true, source: 'cms', cacheHint: { tags: ['pages', 'entry-1'] }, buildTime });
  assert.deepEqual(context.calls, [{ maxAge: 300, swr: 60, tags: ['pages', 'entry-1'], lastModified: buildTime }]);
});

test('a missing page answers 404 with no cache opt-in and no Vary', () => {
  const context = fakeContext();
  applyPageResponse(context, { found: false, source: 'none', cacheHint: { tags: ['pages'] } });
  assert.deepEqual(context.calls, []);
  assert.equal(context.response.status, 404);
  assert.equal(context.response.headers.get('vary'), null);
});

test('a served media response is cached like the pages, tagged media, varied by host only; errors and partial content stay as they are', () => {
  assert.deepEqual(mediaCacheOptions(), { maxAge: 300, swr: 60, tags: ['media'] });
  assert.equal(MEDIA_TAG, 'media');
  assert.equal(MEDIA_VARY, 'Host');
  for (const status of [200, 304]) {
    const calls = [];
    const response = new Response(status === 304 ? null : 'bytes', { status, headers: { etag: 'W/"1-2"', 'last-modified': 'Wed, 07 Oct 2026 12:00:00 GMT', 'cache-control': 'public, max-age=0, must-revalidate' } });
    assert.equal(applyMediaResponse({ cache: { set: (options) => calls.push(options) } }, response), true, String(status));
    assert.deepEqual(calls, [{ maxAge: 300, swr: 60, tags: ['media'] }]);
    assert.equal(response.headers.get('vary'), 'Host');
    assert.equal(response.headers.get('etag'), 'W/"1-2"', "the route's own validators stay");
    assert.equal(response.headers.get('cache-control'), 'public, max-age=0, must-revalidate');
  }
  for (const status of [206, 404, 416, 500]) {
    const calls = [];
    const response = new Response(null, { status });
    assert.equal(applyMediaResponse({ cache: { set: (options) => calls.push(options) } }, response), false, String(status));
    assert.deepEqual(calls, []);
    assert.equal(response.headers.get('vary'), null);
  }
  assert.equal(applyMediaResponse({}, new Response('x')), false, 'no cache provider, nothing to set');
});
