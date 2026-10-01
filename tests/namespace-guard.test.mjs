import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canonicalPathname, deniedResponse, evaluateGate, isEmdashNamespace } from '../src/namespace-gate.ts';

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

test('the denied response is a small, uncached 404 without a redirect', async () => {
  const response = deniedResponse();
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('location'), null);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.ok((await response.text()).length < 100);
});
