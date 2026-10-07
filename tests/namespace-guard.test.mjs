import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canonicalPathname, deniedResponse, evaluateGate, evaluateMachineRequest, isEmdashNamespace } from '../src/namespace-gate.ts';

const configured = {
  EMDASH_ACCESS_TEAM_DOMAIN: 'example-team.cloudflareaccess.invalid',
  CF_ACCESS_AUDIENCE: 'audience-tag',
};
const request = (path, init) => new Request(`https://repoglance.com${path}`, init);
const identity = (email) => async () => (email ? { email } : null);
const throwing = async () => {
  throw new Error('invalid token');
};
const neverCalled = async () => {
  throw new Error('authenticate must not run');
};

test('canonical pathname decodes repeatedly and collapses slashes', () => {
  assert.equal(canonicalPathname('/%5Femdash//admin'), '/_emdash/admin');
  assert.equal(canonicalPathname('/%255Femdash/admin'), '/_emdash/admin');
  assert.equal(canonicalPathname('/_emdash/%E0%A4%A'), '/_emdash/%E0%A4%A');
});

test('namespace detection covers encoded, cased and doubled forms', () => {
  for (const path of ['/_emdash', '/_emdash/', '/_emdash/admin', '/_EMDASH/setup', '/%5Femdash/api/setup', '/_emdash//admin', '/_emdash/api/media/file/x']) {
    assert.equal(isEmdashNamespace(path), true, path);
  }
  for (const path of ['/', '/testers', '/_emdashes', '/emdash/admin', '/x/_emdash']) {
    assert.equal(isEmdashNamespace(path), false, path);
  }
});

test('public routes pass without authentication', async () => {
  const decision = await evaluateGate({ pathname: '/testers', request: request('/testers'), env: {}, authenticate: neverCalled });
  assert.deepEqual(decision, { allow: true, reason: 'public' });
});

test('development passes the namespace through', async () => {
  const decision = await evaluateGate({ pathname: '/_emdash/admin', request: request('/_emdash/admin'), env: {}, authenticate: neverCalled, dev: true });
  assert.deepEqual(decision, { allow: true, reason: 'dev' });
});

test('namespace is denied when Access is not configured, whatever the request carries', async () => {
  const spoofed = request('/_emdash/admin', {
    headers: {
      host: 'repoglance.com',
      'x-forwarded-host': 'example-team.cloudflareaccess.invalid',
      origin: 'https://repoglance.com',
      cookie: 'CF_Authorization=forged',
      'cf-access-jwt-assertion': 'forged',
    },
  });
  for (const env of [{}, { EMDASH_ACCESS_TEAM_DOMAIN: configured.EMDASH_ACCESS_TEAM_DOMAIN }, { CF_ACCESS_AUDIENCE: 'audience-tag' }]) {
    const decision = await evaluateGate({ pathname: '/_emdash/admin', request: spoofed, env, authenticate: neverCalled });
    assert.deepEqual(decision, { allow: false, reason: 'access-not-configured' });
  }
});

test('the request URL is checked even when the parsed pathname looks public', async () => {
  const decision = await evaluateGate({ pathname: '/', request: request('/%5Femdash/setup'), env: {}, authenticate: neverCalled });
  assert.deepEqual(decision, { allow: false, reason: 'access-not-configured' });
});

test('configured Access denies missing, invalid and empty identities', async () => {
  for (const authenticate of [identity(null), throwing, async () => ({ email: '  ' })]) {
    const decision = await evaluateGate({ pathname: '/_emdash/setup', request: request('/_emdash/setup'), env: configured, authenticate });
    assert.deepEqual(decision, { allow: false, reason: 'no-identity' });
  }
});

test('configured Access admits a verified identity, honouring the allowlist', async () => {
  const open = await evaluateGate({ pathname: '/_emdash/admin', request: request('/_emdash/admin'), env: configured, authenticate: identity('owner@example.invalid') });
  assert.deepEqual(open, { allow: true, reason: 'operator' });

  const listed = await evaluateGate({
    pathname: '/_emdash/admin',
    request: request('/_emdash/admin'),
    env: { ...configured, EMDASH_OPERATOR_ALLOWLIST: 'Owner@example.invalid, editor@example.invalid' },
    authenticate: identity('owner@example.invalid'),
  });
  assert.deepEqual(listed, { allow: true, reason: 'operator' });

  const unlisted = await evaluateGate({
    pathname: '/_emdash/admin',
    request: request('/_emdash/admin'),
    env: { ...configured, EMDASH_OPERATOR_ALLOWLIST: 'owner@example.invalid' },
    authenticate: identity('someone@example.invalid'),
  });
  assert.deepEqual(unlisted, { allow: false, reason: 'not-on-allowlist' });
});

const machine = (commonName, email) => async () => ({ commonName, email });
const bearer = { authorization: 'Bearer ec_pat_test' };
const json = (path, method, body, headers = bearer) => request(path, { method, headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('a machine identity is admitted only when the human path yields no email and the JWT carries a common name without one', async () => {
  const base = { pathname: '/_emdash/api/content/pages', env: configured, authenticate: identity(null) };
  const read = request('/_emdash/api/content/pages', { headers: bearer });
  assert.deepEqual(await evaluateGate({ ...base, request: read, verifyMachine: machine('abc123.access') }), { allow: true, reason: 'machine-read' });
  assert.deepEqual(await evaluateGate({ ...base, request: read }), { allow: false, reason: 'no-identity' }, 'no verifier, no machines');
  assert.deepEqual(await evaluateGate({ ...base, request: read, verifyMachine: machine('abc123.access', 'someone@example.invalid') }), { allow: false, reason: 'no-identity' }, 'a human JWT that failed the official path is not a machine');
  assert.deepEqual(await evaluateGate({ ...base, request: read, verifyMachine: machine('   ') }), { allow: false, reason: 'no-identity' });
  assert.deepEqual(await evaluateGate({ ...base, request: read, verifyMachine: throwing }), { allow: false, reason: 'no-identity' });
  assert.deepEqual(await evaluateGate({ ...base, request: read, authenticate: identity('owner@example.invalid'), verifyMachine: neverCalled }), { allow: true, reason: 'operator' }, 'a human never reaches the machine path');
});

test('a machine may read content and schema, ask for a preview link, and must carry the EmDash Bearer token', async () => {
  for (const path of ['/_emdash/api/content/pages', '/_emdash/api/content/pages/home', '/_emdash/api/schema/block-types', '/_emdash/api/schema/block-types/hero']) {
    assert.deepEqual(await evaluateMachineRequest(request(path, { headers: bearer }), path), { allow: true, reason: 'machine-read' }, path);
  }
  assert.deepEqual(await evaluateMachineRequest(request('/_emdash/api/content/pages', { headers: bearer, method: 'HEAD' }), '/_emdash/api/content/pages'), { allow: true, reason: 'machine-read' });
  assert.deepEqual(await evaluateMachineRequest(json('/_emdash/api/content/pages/home/preview-url', 'POST', {}), '/_emdash/api/content/pages/home/preview-url'), { allow: true, reason: 'machine-preview' });
  assert.deepEqual(await evaluateMachineRequest(request('/_emdash/api/content/pages'), '/_emdash/api/content/pages'), { allow: false, reason: 'machine-no-bearer' });
  for (const path of ['/_emdash/api/admin/api-tokens', '/_emdash/api/media', '/_emdash/admin', '/_emdash/api/settings', '/_emdash/api/mcp']) {
    assert.deepEqual(await evaluateMachineRequest(request(path, { headers: bearer }), path), { allow: false, reason: 'machine-forbidden' }, path);
  }
});

test('a machine may stage a draft only against the revision it read, and only as a draft', async () => {
  const entry = '/_emdash/api/content/pages/01ABC';
  assert.deepEqual(await evaluateMachineRequest(json(entry, 'PUT', { data: { title: 'x' }, _rev: 'v3:1700000000' }), entry), { allow: true, reason: 'machine-draft' });
  assert.deepEqual(await evaluateMachineRequest(json(entry, 'PUT', { data: { title: 'x' }, _rev: 'v3:1700000000', status: 'draft' }), entry), { allow: true, reason: 'machine-draft' });
  assert.deepEqual(await evaluateMachineRequest(json(entry, 'PUT', { data: { title: 'x' } }), entry), { allow: false, reason: 'machine-draft-rules' }, 'no _rev');
  assert.deepEqual(await evaluateMachineRequest(json(entry, 'PUT', { data: { title: 'x' }, _rev: '  ' }), entry), { allow: false, reason: 'machine-draft-rules' }, 'blank _rev');
  assert.deepEqual(await evaluateMachineRequest(json(entry, 'PUT', { data: { title: 'x' }, _rev: 'v3', status: 'published' }), entry), { allow: false, reason: 'machine-draft-rules' }, 'not a draft');
  assert.deepEqual(await evaluateMachineRequest(request(entry, { method: 'PUT', headers: bearer, body: 'not json' }), entry), { allow: false, reason: 'machine-draft-rules' }, 'unparsable body');
  assert.deepEqual(await evaluateMachineRequest(json('/_emdash/api/content/pages', 'POST', { slug: 'about', data: {}, status: 'draft' }), '/_emdash/api/content/pages'), { allow: true, reason: 'machine-create-draft' });
  assert.deepEqual(await evaluateMachineRequest(json('/_emdash/api/content/pages', 'POST', { slug: 'about', data: {} }), '/_emdash/api/content/pages'), { allow: false, reason: 'machine-draft-rules' }, 'create without draft status');
});

test("a machine's draft write may carry only the content and the revision: live metadata, lock overrides and slug changes are a human's call", async () => {
  const entry = '/_emdash/api/content/pages/01ABC';
  for (const extra of [{ overrideLock: true }, { publishedAt: '2026-10-07T00:00:00Z' }, { authorId: 'someone' }, { bylines: [] }, { seo: { title: 'x' } }, { taxonomies: {} }, { references: {} }, { skipRevision: true }, { slug: 'renamed' }]) {
    const decision = await evaluateMachineRequest(json(entry, 'PUT', { data: { title: 'x' }, _rev: 'v3', ...extra }), entry);
    assert.deepEqual(decision, { allow: false, reason: 'machine-draft-rules' }, Object.keys(extra)[0]);
  }
  assert.deepEqual(await evaluateMachineRequest(json(entry, 'PUT', { data: { title: 'x' }, _rev: 'v3', migrateBlocks: true, replaceBlocks: false }), entry), { allow: true, reason: 'machine-draft' });
  assert.deepEqual(await evaluateMachineRequest(json('/_emdash/api/content/pages', 'POST', { slug: 'about', data: {}, status: 'draft', publishedAt: '2026-10-07T00:00:00Z' }), '/_emdash/api/content/pages'), { allow: false, reason: 'machine-draft-rules' }, 'create with live metadata');
});

test('a machine cannot send an oversized body or read the operator list', async () => {
  const entry = '/_emdash/api/content/pages/01ABC';
  const declared = request(entry, { method: 'PUT', headers: { ...bearer, 'content-type': 'application/json', 'content-length': '5000000' }, body: JSON.stringify({ data: {}, _rev: 'v3' }) });
  assert.deepEqual(await evaluateMachineRequest(declared, entry), { allow: false, reason: 'machine-draft-rules' }, 'declared oversize');
  const huge = json(entry, 'PUT', { data: { title: 'x'.repeat(1_100_000) }, _rev: 'v3' });
  assert.deepEqual(await evaluateMachineRequest(huge, entry), { allow: false, reason: 'machine-draft-rules' }, 'actual oversize');
  assert.deepEqual(await evaluateMachineRequest(request('/_emdash/api/content/pages/authors', { headers: bearer }), '/_emdash/api/content/pages/authors'), { allow: false, reason: 'machine-forbidden' });
});

test('a machine can never publish, unpublish, schedule, delete, or write schema', async () => {
  for (const [path, method, body] of [
    ['/_emdash/api/content/pages/01ABC/publish', 'POST', { _rev: 'v3' }],
    ['/_emdash/api/content/pages/01ABC/unpublish', 'POST', { _rev: 'v3' }],
    ['/_emdash/api/content/pages/01ABC/schedule', 'POST', { scheduledAt: '2027-01-01T00:00:00Z' }],
    ['/_emdash/api/content/pages/01ABC/discard-draft', 'POST', {}],
    ['/_emdash/api/content/pages/01ABC/restore', 'POST', {}],
    ['/_emdash/api/content/pages/01ABC', 'DELETE', undefined],
    ['/_emdash/api/content/pages/01ABC/permanent', 'DELETE', undefined],
    ['/_emdash/api/schema/block-types/hero', 'PUT', { expectedFingerprint: 'x', fields: [] }],
    ['/_emdash/api/schema/block-types', 'POST', { slug: 'x', label: 'x', fields: [] }],
    ['/_emdash/api/schema/block-types/hero/versions/2/activate', 'POST', { expectedFingerprint: 'x' }],
    ['/_emdash/api/content/pages/01ABC', 'PATCH', { _rev: 'v3' }],
    ['/_emdash/api/content/%2E%2E/pages/01ABC/publish', 'POST', { _rev: 'v3' }],
  ]) {
    const req = body === undefined ? request(path, { method, headers: bearer }) : json(path, method, body);
    const decision = await evaluateMachineRequest(req, path);
    assert.equal(decision.allow, false, `${method} ${path}`);
    assert.equal(decision.reason, 'machine-forbidden', `${method} ${path}`);
  }
});

test('the denied response is a small, uncached 404 without a redirect', async () => {
  const response = deniedResponse();
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('location'), null);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.ok((await response.text()).length < 100);
});
