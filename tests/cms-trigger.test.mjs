import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deserializeField, matchTrigger, rawEmail, readLibraryFromD1, readLivePagesFromD1, slugFromResponse } from '../src/cms/trigger-helpers.ts';

test('the trigger matches exactly the requests that change live content', () => {
  assert.deepEqual(matchTrigger('POST', '/_emdash/api/content/pages/01ABC/publish'), { collection: 'pages', id: '01ABC', action: 'publish' });
  assert.deepEqual(matchTrigger('POST', '/_emdash/api/visual-editing/content/pages/01ABC/publish'), { collection: 'pages', id: '01ABC', action: 'publish' });
  assert.deepEqual(matchTrigger('POST', '/_emdash/api/content/pages/01ABC/unpublish'), { collection: 'pages', id: '01ABC', action: 'unpublish' });
  assert.deepEqual(matchTrigger('POST', '/_emdash/api/content/pages/01ABC/restore'), { collection: 'pages', id: '01ABC', action: 'restore' });
  assert.deepEqual(matchTrigger('DELETE', '/_emdash/api/content/pages/01ABC'), { collection: 'pages', id: '01ABC', action: 'delete' });
  assert.deepEqual(matchTrigger('DELETE', '/_emdash/api/content/pages/01ABC/permanent'), { collection: 'pages', id: '01ABC', action: 'delete' });
  assert.deepEqual(matchTrigger('post', '/_emdash/api/content/pages/a%2Fb/publish'), { collection: 'pages', id: 'a/b', action: 'publish' }, 'method case-insensitive, id decoded');
  assert.deepEqual(matchTrigger('POST', '/_emdash/api/content/pages/%E0%A4%A/publish')?.id, '%E0%A4%A', 'a malformed id is kept as is, never thrown on');
  for (const [method, path] of [
    ['PUT', '/_emdash/api/content/pages/01ABC'],
    ['POST', '/_emdash/api/content/pages'],
    ['POST', '/_emdash/api/content/pages/01ABC/schedule'],
    ['POST', '/_emdash/api/content/pages/01ABC/preview-url'],
    ['GET', '/_emdash/api/content/pages/01ABC/publish'],
    ['POST', '/_emdash/api/content/pages/01ABC/publish/extra'],
    ['POST', '/_emdash/api/schema/block-types/hero/versions/2/activate'],
    ['POST', '/testers'],
  ]) {
    assert.equal(matchTrigger(method, path), null, `${method} ${path}`);
  }
});

test("the slug comes from EmDash's response when it carries an item, and is undefined otherwise", async () => {
  const ok = new Response(JSON.stringify({ success: true, data: { item: { id: '01ABC', slug: 'home' }, _rev: 'v3' } }), { headers: { 'content-type': 'application/json' } });
  assert.equal(await slugFromResponse(ok), 'home');
  assert.equal(await ok.text().then(() => 'body still readable'), 'body still readable', 'the response is cloned, not consumed');
  assert.equal(await slugFromResponse(new Response('not json')), undefined);
  assert.equal(await slugFromResponse(new Response(JSON.stringify({ data: { item: { slug: 7 } } }))), undefined);
  assert.equal(await slugFromResponse(new Response(null, { status: 204 })), undefined);
});

test('the D1 reader selects the declared fields of the published rows and parses only JSON-typed columns', async () => {
  const queries = [];
  const db = {
    prepare(query) {
      queries.push(query);
      return {
        async all() {
          return {
            results: [
              { slug: 'home', title: '[1] A title that looks like JSON', description: '{"not": "parsed"}', layout: '[{"_type":"hero","_version":2,"_key":"k","heading":"h"}]' },
              { slug: 'testers', title: 'Join', description: null, layout: '[]' },
            ],
          };
        },
      };
    },
  };
  const fields = [{ slug: 'title', type: 'string' }, { slug: 'description', type: 'text' }, { slug: 'layout', type: 'blocks' }];
  const pages = await readLivePagesFromD1(db, fields, 'pages');
  assert.equal(queries.length, 1);
  assert.equal(queries[0], `SELECT "slug", "title", "description", "layout" FROM "ec_pages" WHERE deleted_at IS NULL AND status = 'published' ORDER BY slug`);
  assert.deepEqual(pages, [
    { slug: 'home', data: { title: '[1] A title that looks like JSON', description: '{"not": "parsed"}', layout: [{ _type: 'hero', _version: 2, _key: 'k', heading: 'h' }] } },
    { slug: 'testers', data: { title: 'Join', description: null, layout: [] } },
  ]);
  await assert.rejects(readLivePagesFromD1(db, [{ slug: 'title"; DROP TABLE x; --', type: 'string' }], 'pages'), /invalid collection or field identifier/);
  await assert.rejects(readLivePagesFromD1(db, fields, 'pages; --'), /invalid collection or field identifier/);
  assert.equal(deserializeField('[broken', 'blocks'), '[broken', 'unparsable JSON stays a string');
});

test('the raw email is a plain-text RFC 5322 message with folded-out header injections', () => {
  const raw = rawEmail({ from: 'mirror@repoglance.com', to: 'agent@example.invalid', subject: 'line one\r\nBcc: evil@example.invalid', text: 'body' }, 'id123', new Date('2026-10-07T15:00:00Z'));
  const [headers, body] = raw.split('\r\n\r\n');
  assert.equal(body, 'body');
  assert.ok(headers.includes('Subject: line one Bcc: evil@example.invalid'), 'the subject stays one header line');
  assert.ok(!/\r\nBcc:/.test(headers));
  assert.ok(headers.includes('From: mirror@repoglance.com\r\nTo: agent@example.invalid'));
  assert.ok(headers.includes('Message-ID: <id123@repoglance.com>'));
  assert.ok(headers.includes('Date: Wed, 07 Oct 2026 15:00:00 GMT'));
  assert.ok(headers.includes('Content-Type: text/plain; charset=utf-8'));
});

test('the D1 library reader records the ready media items without their author', async () => {
  const queries = [];
  const db = {
    prepare(query) {
      queries.push(query);
      return {
        async all() {
          return {
            results: [
              { id: '01A', filename: 'home-widgets-light.webp', mime_type: 'image/webp', size: 47322, width: 1080, height: 1920, alt: 'alt', content_hash: 'sha1:abc', storage_key: '01A.webp', status: 'ready', author_id: 'someone' },
              { id: '01B', filename: 'x.png', mime_type: 'image/png', size: null, width: null, height: null, alt: null, content_hash: null, storage_key: '01B.png', status: 'ready' },
            ],
          };
        },
      };
    },
  };
  const items = await readLibraryFromD1(db);
  assert.equal(queries.length, 1);
  assert.match(queries[0], /FROM "media" WHERE status = 'ready' ORDER BY filename, id$/);
  assert.ok(!/author/.test(queries[0]));
  assert.deepEqual(items, [
    { id: '01A', filename: 'home-widgets-light.webp', mimeType: 'image/webp', size: 47322, width: 1080, height: 1920, alt: 'alt', contentHash: 'sha1:abc', storageKey: '01A.webp', status: 'ready' },
    { id: '01B', filename: 'x.png', mimeType: 'image/png', size: null, width: null, height: null, alt: null, contentHash: null, storageKey: '01B.png', status: 'ready' },
  ]);
});
