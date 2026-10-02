import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PAGES_COLLECTION, PUBLIC_PAGE_MAX_AGE, PUBLIC_PAGE_SWR, PUBLIC_PAGE_VARY, applyPageResponse, publicPageCacheOptions } from '../src/page-cache.ts';

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
});

test('a CMS render opts in with its tags and validator and varies by host and cookie', () => {
  const lastModified = new Date('2026-10-01T12:00:00Z');
  const context = fakeContext();
  applyPageResponse(context, { found: true, source: 'cms', cacheHint: { tags: ['pages', 'entry-1'], lastModified } });
  assert.deepEqual(context.calls, [{ maxAge: 300, swr: 60, tags: ['pages', 'entry-1'], lastModified }]);
  assert.equal(context.response.headers.get('vary'), 'Host, Cookie');
  assert.equal(context.response.status, undefined);
});

test('a seed render keeps the purge tags but never inherits the retired entry validator', () => {
  const context = fakeContext();
  applyPageResponse(context, { found: true, source: 'seed', cacheHint: { tags: ['pages', 'entry-1'], lastModified: new Date('2026-10-01T12:00:00Z') } });
  assert.deepEqual(context.calls, [{ maxAge: 300, swr: 60, tags: ['pages', 'entry-1'] }]);
  assert.equal(context.response.headers.get('vary'), 'Host, Cookie');
  const bare = fakeContext();
  applyPageResponse(bare, { found: true, source: 'seed' });
  assert.deepEqual(bare.calls, [{ maxAge: 300, swr: 60, tags: ['pages'] }]);
});

test('a missing page answers 404 with no cache opt-in and no Vary', () => {
  const context = fakeContext();
  applyPageResponse(context, { found: false, source: 'none', cacheHint: { tags: ['pages'] } });
  assert.deepEqual(context.calls, []);
  assert.equal(context.response.status, 404);
  assert.equal(context.response.headers.get('vary'), null);
});
